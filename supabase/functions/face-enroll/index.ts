import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EnrollRequest {
  images: string[]; // Array base64 images (min 1, ideal 3 frames)
}

interface NormalizedLandmark {
  type: string;
  nx: number; // normalized x relative to face bbox [0..1]
  ny: number; // normalized y relative to face bbox [0..1]
}

interface FaceEmbedding {
  landmarks: NormalizedLandmark[];
  detection_confidence: number;
  enrolled_at: string;
  version: number; // embedding schema version for future upgrades
}

/** Normalize GCV landmarks relative to face bounding box */
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

/** Decode base64 string to Uint8Array (Deno-compatible) */
function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/^data:image\/[a-z]+;base64,/, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verifikasi JWT user
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

    const { images }: EnrollRequest = await req.json();
    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Minimal 1 gambar diperlukan" }),
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
          success: false,
          error:
            "Layanan face recognition belum dikonfigurasi. Hubungi administrator.",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Proses gambar pertama (atau gambar terbaik dari beberapa frame)
    const imageBase64 = images[0].replace(/^data:image\/[a-z]+;base64,/, "");

    // Kirim ke Google Cloud Vision Face Detection
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${gcvApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: "FACE_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errText = await visionResponse.text();
      console.error("GCV error:", errText);
      throw new Error("Gagal menghubungi layanan pengenalan wajah");
    }

    const visionData = await visionResponse.json();
    const faceAnnotation = visionData.responses?.[0]?.faceAnnotations?.[0];

    if (!faceAnnotation) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Wajah tidak terdeteksi. Pastikan wajah terlihat jelas dan pencahayaan cukup.",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const landmarks: NormalizedLandmark[] = normalizeLandmarks(
      faceAnnotation.landmarks ?? [],
      faceAnnotation.fdBoundingPoly ?? faceAnnotation.boundingPoly
    );

    if (landmarks.length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Landmark wajah tidak cukup. Coba dengan pencahayaan lebih baik.",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buat face embedding
    const embedding: FaceEmbedding = {
      landmarks,
      detection_confidence: faceAnnotation.detectionConfidence ?? 0,
      enrolled_at: new Date().toISOString(),
      version: 1,
    };

    // Simpan embedding sebagai JSON di Supabase Storage
    // (bukan raw image — privasi lebih terjaga)
    const embeddingBytes = new TextEncoder().encode(JSON.stringify(embedding));
    const { error: storageError } = await supabase.storage
      .from("face-references")
      .upload(`${user.id}/embedding.json`, embeddingBytes, {
        contentType: "application/json",
        upsert: true,
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      throw storageError;
    }

    // Stable reference ID — tidak mengandung timestamp agar mudah diakses
    const faceReferenceId = `face_${user.id}`;

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        face_enrolled: true,
        face_reference_id: faceReferenceId,
        face_enrolled_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        face_reference_id: faceReferenceId,
        message: "Wajah berhasil didaftarkan",
        landmarks_count: landmarks.length,
        detection_confidence: embedding.detection_confidence,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("face-enroll error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Terjadi kesalahan internal. Coba lagi.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
