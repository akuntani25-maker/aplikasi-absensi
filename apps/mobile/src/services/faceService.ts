import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

export interface FaceEnrollResult {
  success: boolean;
  face_reference_id?: string;
  message: string;
}

export interface FaceVerifyResult {
  match: boolean;
  confidence: number;
  message: string;
}

export const faceService = {
  async enrollFace(imageBase64Frames: string[]): Promise<FaceEnrollResult> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Tidak ada sesi aktif');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/face-enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ images: imageBase64Frames }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? 'Gagal mendaftarkan wajah');
    }
    return result;
  },

  async verifyFace(imageBase64: string, faceReferenceId: string): Promise<FaceVerifyResult> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Tidak ada sesi aktif');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/face-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        face_reference_id: faceReferenceId,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? 'Gagal memverifikasi wajah');
    }
    return result;
  },
};
