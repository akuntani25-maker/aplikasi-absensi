-- ============================================================
-- Migration 004: Supabase Storage Policies
-- Bucket: face-references (dibuat via Edge Function / Dashboard)
-- ============================================================

-- Buat bucket jika belum ada (jalankan sekali via Supabase Dashboard atau CLI)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'face-references',
--   'face-references',
--   false,            -- private bucket
--   5242880,          -- 5 MB max
--   ARRAY['image/jpeg', 'image/png', 'image/webp']
-- ) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Helper: cek apakah path milik user yang sedang login
-- Path format: {user_id}/face.jpg
-- ============================================================
CREATE OR REPLACE FUNCTION storage.is_owner(object_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT (storage.foldername(object_name))[1] = (auth.uid())::text;
$$;

-- ============================================================
-- RLS Policies: face-references bucket
-- ============================================================

-- Karyawan: upload foto wajah sendiri (enroll)
CREATE POLICY "Karyawan upload wajah sendiri"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'face-references'
  AND storage.is_owner(name)
);

-- Karyawan: update/replace foto wajah sendiri
CREATE POLICY "Karyawan update wajah sendiri"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'face-references'
  AND storage.is_owner(name)
);

-- Karyawan: baca foto wajah sendiri
CREATE POLICY "Karyawan baca wajah sendiri"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'face-references'
  AND storage.is_owner(name)
);

-- Admin: baca semua foto wajah
CREATE POLICY "Admin baca semua wajah"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'face-references'
  AND is_admin()
);

-- Admin: hapus foto wajah
CREATE POLICY "Admin hapus foto wajah"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'face-references'
  AND is_admin()
);

-- ============================================================
-- Tabel: audit_logs — opsional, untuk keamanan enterprise
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  table_name  text,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang bisa baca audit logs
CREATE POLICY "Admin baca audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (is_admin());

-- System/service role yang bisa insert
CREATE POLICY "Service role insert audit"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);
