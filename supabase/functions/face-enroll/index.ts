import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrollRequest {
  images: string[]; // Array base64 images (3 frames)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verifikasi JWT user
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

    // Decode JWT untuk mendapatkan user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { images }: EnrollRequest = await req.json();
    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: 'Gambar diperlukan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TODO: Integrasi Google Cloud Vision API
    // 1. Kirim gambar ke Google Cloud Vision Face Detection
    // 2. Ekstrak face landmarks dan embedding
    // 3. Simpan embedding di Supabase Storage (terenkripsi)
    // 4. Simpan reference ID di table profiles

    // Placeholder: generate reference ID
    const gcvApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!gcvApiKey) {
      throw new Error('GOOGLE_CLOUD_VISION_API_KEY tidak dikonfigurasi');
    }

    // Proses gambar pertama sebagai referensi utama
    const imageBase64 = images[0].replace(/^data:image\/[a-z]+;base64,/, '');

    // Panggil Google Cloud Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${gcvApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [
              { type: 'FACE_DETECTION', maxResults: 1 },
            ],
          }],
        }),
      }
    );

    const visionData = await visionResponse.json();
    const faceAnnotations = visionData.responses?.[0]?.faceAnnotations;

    if (!faceAnnotations || faceAnnotations.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.',
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Simpan gambar enrollmen ke Supabase Storage (encrypted bucket)
    const faceReferenceId = `face_${user.id}_${Date.now()}`;
    const { error: storageError } = await supabase.storage
      .from('face-references')
      .upload(`${user.id}/${faceReferenceId}.jpg`, Buffer.from(imageBase64, 'base64'), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (storageError) {
      throw storageError;
    }

    // Update profile dengan face_reference_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        face_enrolled: true,
        face_reference_id: faceReferenceId,
        face_enrolled_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      success: true,
      face_reference_id: faceReferenceId,
      message: 'Wajah berhasil didaftarkan',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('face-enroll error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Terjadi kesalahan internal',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
