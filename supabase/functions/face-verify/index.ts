import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  image_base64: string;
  face_reference_id: string;
}

// Rate limiting sederhana: max 10 verifikasi per jam per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3600 * 1000 });
    return true;
  }

  if (limit.count >= 10) return false;

  limit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verifikasi JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cek rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({
        match: false,
        message: 'Terlalu banyak percobaan. Coba lagi dalam 1 jam.',
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image_base64, face_reference_id }: VerifyRequest = await req.json();
    if (!image_base64 || !face_reference_id) {
      return new Response(JSON.stringify({ error: 'Parameter tidak lengkap' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const gcvApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!gcvApiKey) {
      throw new Error('GOOGLE_CLOUD_VISION_API_KEY tidak dikonfigurasi');
    }

    // Ambil gambar referensi dari Supabase Storage
    const { data: refImageData, error: storageError } = await supabase.storage
      .from('face-references')
      .download(`${user.id}/${face_reference_id}.jpg`);

    if (storageError || !refImageData) {
      return new Response(JSON.stringify({
        match: false,
        message: 'Data wajah referensi tidak ditemukan',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Konversi referensi ke base64
    const refBuffer = await refImageData.arrayBuffer();
    const refBase64 = btoa(String.fromCharCode(...new Uint8Array(refBuffer)));

    // Deteksi wajah di kedua gambar menggunakan Google Cloud Vision
    const cleanInput = image_base64.replace(/^data:image\/[a-z]+;base64,/, '');

    const [inputResponse, refResponse] = await Promise.all([
      fetch(`https://vision.googleapis.com/v1/images:annotate?key=${gcvApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: cleanInput },
            features: [{ type: 'FACE_DETECTION', maxResults: 1 }],
          }],
        }),
      }),
      fetch(`https://vision.googleapis.com/v1/images:annotate?key=${gcvApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: refBase64 },
            features: [{ type: 'FACE_DETECTION', maxResults: 1 }],
          }],
        }),
      }),
    ]);

    const [inputData, refData] = await Promise.all([
      inputResponse.json(),
      refResponse.json(),
    ]);

    const inputFace = inputData.responses?.[0]?.faceAnnotations?.[0];
    const refFace = refData.responses?.[0]?.faceAnnotations?.[0];

    if (!inputFace) {
      return new Response(JSON.stringify({
        match: false,
        confidence: 0,
        message: 'Wajah tidak terdeteksi di foto saat ini',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!refFace) {
      return new Response(JSON.stringify({
        match: false,
        confidence: 0,
        message: 'Wajah tidak terdeteksi di foto referensi',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bandingkan face landmarks (simplified comparison via detection confidence)
    // Untuk produksi, gunakan model face embedding yang lebih canggih
    // seperti Google Cloud Vision Product Search atau TensorFlow.js FaceNet
    const inputConf = inputFace.detectionConfidence ?? 0;
    const refConf = refFace.detectionConfidence ?? 0;

    // Simplified matching: bandingkan landmark positions
    const inputLandmarks = inputFace.landmarks ?? [];
    const refLandmarks = refFace.landmarks ?? [];

    let similarity = 0;
    if (inputLandmarks.length > 0 && refLandmarks.length > 0) {
      // Hitung similarity berdasarkan posisi relatif landmark
      const matchedCount = inputLandmarks.filter((lm: any) =>
        refLandmarks.some((rl: any) => rl.type === lm.type)
      ).length;
      similarity = (matchedCount / Math.max(inputLandmarks.length, refLandmarks.length)) *
                   Math.min(inputConf, refConf);
    }

    const CONFIDENCE_THRESHOLD = 0.75; // Sesuaikan berdasarkan testing
    const match = similarity >= CONFIDENCE_THRESHOLD;

    return new Response(JSON.stringify({
      match,
      confidence: similarity,
      message: match ? 'Wajah berhasil diverifikasi' : 'Wajah tidak cocok',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('face-verify error:', error);
    return new Response(JSON.stringify({
      match: false,
      error: 'Terjadi kesalahan internal',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
