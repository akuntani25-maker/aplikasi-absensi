import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  image_base64: string;
  face_reference_id: string;
}

interface NormalizedLandmark {
  type: string;
  nx: number;
  ny: number;
}

interface FaceEmbedding {
  landmarks: NormalizedLandmark[];
  detection_confidence: number;
  enrolled_at: string;
  version: number;
}

// ─── Rate limiting (in-memory, resets on cold start) ─────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// ─── Normalize landmarks relative to face bounding box ───────────────────────
function normalizeLandmarks(
  landmarks: Array<{ type: string; position: { x: number; y: number; z: number } }>,
  bbox: { vertices: Array<{ x?: number; y?: number }> }
): NormalizedLandmark[] {
  const xs = bbox.vertices.map((v) => v.x ?? 0);
  const ys = bbox.vertices.map((v) => v.y ?? 0);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const width = Math.max(...xs) - left;
  const height = Math.max(...ys) - top;

  if (width === 0 || height === 0) return [];

  return landmarks.map((lm) => ({
    type: lm.type,
    nx: (lm.position.x - left) / width,
    ny: (lm.position.y - top) / height,
  }));
}

/**
 * Hitung similarity score antara dua set normalized landmarks.
 *
 * Algoritma:
 * 1. Pasangkan landmark dengan tipe yang sama antara kedua foto
 * 2. Hitung rata-rata jarak Euclidean per landmark
 * 3. Konversi ke similarity: 1 / (1 + avgDistance / SCALE)
 *    - Intra-person (same face): avg distance ~0.02–0.06
 *    - Inter-person (different face): avg distance ~0.10–0.20
 *    - SCALE = 0.10 → intra = ~0.65–0.91, inter = ~0.50
 *
 * Threshold yang direkomendasikan: 0.75
 */
function computeSimilarity(
  embedding: NormalizedLandmark[],
  fresh: NormalizedLandmark[]
): number {
  const SCALE = 0.10;

  const embMap = new Map(embedding.map((lm) => [lm.type, lm]));

  let totalDist = 0;
  let matched = 0;

  for (const freshLm of fresh) {
    const ref = embMap.get(freshLm.type);
    if (!ref) continue;
    const dx = freshLm.nx - ref.nx;
    const dy = freshLm.ny - ref.ny;
    totalDist += Math.sqrt(dx * dx + dy * dy);
    matched++;
  }

  if (matched < 5) return 0; // Terlalu sedikit landmark untuk perbandingan bermakna

  const avgDist = totalDist / matched;
  // Sigmoid-like conversion: distance rendah → similarity tinggi
  return 1 / (1 + avgDist / SCALE);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: maks 10 verifikasi per jam
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({
          match: false,
          confidence: 0,
          message: "Terlalu banyak percobaan. Coba lagi dalam 1 jam.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { image_base64, face_reference_id }: VerifyRequest = await req.json();
    if (!image_base64 || !face_reference_id) {
      return new Response(
        JSON.stringify({ error: "Parameter tidak lengkap" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const gcvApiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
    if (!gcvApiKey) {
      return new Response(
        JSON.stringify({
          match: false,
          error:
            "Layanan face recognition belum dikonfigurasi. Hubungi administrator.",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ambil embedding dari Supabase Storage
    const { data: embBlob, error: storageError } = await supabase.storage
      .from("face-references")
      .download(`${user.id}/embedding.json`);

    if (storageError || !embBlob) {
      return new Response(
        JSON.stringify({
          match: false,
          confidence: 0,
          message:
            "Data wajah referensi tidak ditemukan. Lakukan pendaftaran wajah terlebih dahulu.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const embeddingText = await embBlob.text();
    const storedEmbedding: FaceEmbedding = JSON.parse(embeddingText);

    // Kirim gambar baru ke GCV Face Detection
    const cleanInput = image_base64.replace(
      /^data:image\/[a-z]+;base64,/,
      ""
    );

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${gcvApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: cleanInput },
              features: [{ type: "FACE_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      throw new Error("Gagal menghubungi layanan pengenalan wajah");
    }

    const visionData = await visionResponse.json();
    const faceAnnotation = visionData.responses?.[0]?.faceAnnotations?.[0];

    if (!faceAnnotation) {
      return new Response(
        JSON.stringify({
          match: false,
          confidence: 0,
          message: "Wajah tidak terdeteksi. Posisikan wajah lebih dekat ke kamera.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normalisasi landmark foto baru
    const freshLandmarks = normalizeLandmarks(
      faceAnnotation.landmarks ?? [],
      faceAnnotation.fdBoundingPoly ?? faceAnnotation.boundingPoly
    );

    if (freshLandmarks.length < 5) {
      return new Response(
        JSON.stringify({
          match: false,
          confidence: 0,
          message: "Wajah tidak dapat dianalisis. Pastikan pencahayaan cukup.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Hitung similarity score
    const similarity = computeSimilarity(
      storedEmbedding.landmarks,
      freshLandmarks
    );

    // Faktor dalam detection confidence kedua foto
    const detectionScore = Math.sqrt(
      (storedEmbedding.detection_confidence ?? 1) *
      (faceAnnotation.detectionConfidence ?? 1)
    );

    const finalConfidence = similarity * detectionScore;

    // Threshold: 0.75 (dapat dikonfigurasi via env var)
    const threshold = parseFloat(
      Deno.env.get("FACE_MATCH_THRESHOLD") ?? "0.75"
    );
    const match = finalConfidence >= threshold;

    console.log(`Face verify [${user.id}]: similarity=${similarity.toFixed(3)}, detScore=${detectionScore.toFixed(3)}, final=${finalConfidence.toFixed(3)}, match=${match}`);

    return new Response(
      JSON.stringify({
        match,
        confidence: parseFloat(finalConfidence.toFixed(4)),
        message: match ? "Wajah berhasil diverifikasi" : "Wajah tidak cocok. Coba lagi dengan pencahayaan yang lebih baik.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("face-verify error:", error);
    return new Response(
      JSON.stringify({
        match: false,
        confidence: 0,
        error: "Terjadi kesalahan internal.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
