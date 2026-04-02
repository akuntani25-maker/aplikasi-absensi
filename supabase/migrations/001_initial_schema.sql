-- ============================================================
-- Migration: 001_initial_schema
-- Skema database awal untuk aplikasi absensi karyawan
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Custom Types ─────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('employee', 'admin', 'super_admin');
CREATE TYPE attendance_type AS ENUM ('check_in', 'check_out');
CREATE TYPE attendance_status AS ENUM ('valid', 'invalid_location', 'invalid_face', 'pending');
CREATE TYPE daily_status AS ENUM ('present', 'late', 'absent', 'half_day');

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────

CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id       TEXT UNIQUE NOT NULL,
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'employee',
  department        TEXT,
  position          TEXT,
  phone             TEXT,
  avatar_url        TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  face_enrolled     BOOLEAN NOT NULL DEFAULT false,
  face_reference_id TEXT,
  face_enrolled_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Offices ─────────────────────────────────────────────────────────────────

CREATE TABLE offices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  address        TEXT NOT NULL,
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL,
  radius_meters  INTEGER NOT NULL DEFAULT 100,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Employee-Office Assignments ──────────────────────────────────────────────

CREATE TABLE employee_offices (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  office_id    UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, office_id)
);

-- ─── Attendance Records ───────────────────────────────────────────────────────

CREATE TABLE attendance_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  office_id         UUID REFERENCES offices(id),
  type              attendance_type NOT NULL,
  status            attendance_status NOT NULL DEFAULT 'pending',
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Lokasi
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  distance_meters   DOUBLE PRECISION,
  location_valid    BOOLEAN NOT NULL DEFAULT false,
  location_accuracy DOUBLE PRECISION,
  is_mock_location  BOOLEAN NOT NULL DEFAULT false,

  -- Face recognition
  face_confidence   DOUBLE PRECISION,
  face_valid        BOOLEAN NOT NULL DEFAULT false,
  liveness_passed   BOOLEAN NOT NULL DEFAULT false,

  -- Device info
  device_id         TEXT,
  device_model      TEXT,
  os_version        TEXT,
  app_version       TEXT,

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Daily Attendance Summary ─────────────────────────────────────────────────

CREATE TABLE daily_attendance (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  check_in_time         TIMESTAMPTZ,
  check_out_time        TIMESTAMPTZ,
  check_in_record_id    UUID REFERENCES attendance_records(id),
  check_out_record_id   UUID REFERENCES attendance_records(id),
  total_hours           DOUBLE PRECISION,
  status                daily_status NOT NULL DEFAULT 'absent',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- ─── Work Schedules ───────────────────────────────────────────────────────────

CREATE TABLE work_schedules (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT NOT NULL,
  check_in_time           TIME NOT NULL DEFAULT '08:00',
  check_out_time          TIME NOT NULL DEFAULT '17:00',
  late_threshold_minutes  INTEGER NOT NULL DEFAULT 15,
  timezone                TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  is_default              BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_attendance_employee   ON attendance_records(employee_id);
CREATE INDEX idx_attendance_timestamp  ON attendance_records(timestamp DESC);
CREATE INDEX idx_attendance_status     ON attendance_records(status);
CREATE INDEX idx_daily_employee        ON daily_attendance(employee_id);
CREATE INDEX idx_daily_date            ON daily_attendance(date DESC);
CREATE INDEX idx_daily_employee_date   ON daily_attendance(employee_id, date DESC);
CREATE INDEX idx_profiles_employee_id  ON profiles(employee_id);
CREATE INDEX idx_profiles_role         ON profiles(role);
CREATE INDEX idx_employee_offices_emp  ON employee_offices(employee_id);

-- ─── updated_at Trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at         BEFORE UPDATE ON profiles         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_offices_updated_at          BEFORE UPDATE ON offices          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_daily_attendance_updated_at BEFORE UPDATE ON daily_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_work_schedules_updated_at   BEFORE UPDATE ON work_schedules   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Supabase Realtime ───────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_attendance;
