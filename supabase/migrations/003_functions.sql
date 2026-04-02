-- ============================================================
-- Migration: 003_functions
-- Database functions & triggers untuk proses absensi
-- ============================================================

-- ─── Sequence untuk Employee ID ───────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS employee_id_seq START 1;

-- ─── Auto-create profile saat user baru register ─────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, employee_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'EMP-' || LPAD(NEXTVAL('employee_id_seq')::TEXT, 4, '0')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Process attendance: update daily_attendance summary ─────────────────────

CREATE OR REPLACE FUNCTION process_attendance()
RETURNS TRIGGER AS $$
DECLARE
  v_schedule   work_schedules%ROWTYPE;
  v_tz         TEXT;
  v_local_date DATE;
  v_late_ts    TIMESTAMPTZ;
  v_new_status daily_status;
BEGIN
  -- Hanya proses jika status valid
  IF NEW.status != 'valid' THEN
    RETURN NEW;
  END IF;

  -- Ambil jadwal default
  SELECT * INTO v_schedule FROM work_schedules WHERE is_default = true LIMIT 1;
  v_tz := COALESCE(v_schedule.timezone, 'Asia/Jakarta');

  -- Konversi timestamp ke tanggal lokal
  v_local_date := (NEW.timestamp AT TIME ZONE v_tz)::DATE;

  IF NEW.type = 'check_in' THEN
    -- Hitung batas terlambat
    v_late_ts := (v_local_date::TIMESTAMPTZ AT TIME ZONE v_tz)
                 + v_schedule.check_in_time
                 + (v_schedule.late_threshold_minutes || ' minutes')::INTERVAL;

    v_new_status := CASE
      WHEN NEW.timestamp > v_late_ts THEN 'late'
      ELSE 'present'
    END;

    INSERT INTO daily_attendance (employee_id, date, check_in_time, check_in_record_id, status)
    VALUES (NEW.employee_id, v_local_date, NEW.timestamp, NEW.id, v_new_status)
    ON CONFLICT (employee_id, date) DO UPDATE SET
      check_in_time      = EXCLUDED.check_in_time,
      check_in_record_id = EXCLUDED.check_in_record_id,
      status             = EXCLUDED.status,
      updated_at         = NOW();

  ELSIF NEW.type = 'check_out' THEN
    UPDATE daily_attendance
    SET
      check_out_time      = NEW.timestamp,
      check_out_record_id = NEW.id,
      total_hours         = EXTRACT(EPOCH FROM (NEW.timestamp - check_in_time)) / 3600.0,
      updated_at          = NOW()
    WHERE employee_id = NEW.employee_id
      AND date        = v_local_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_attendance_inserted
  AFTER INSERT ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION process_attendance();

-- ─── Seed: Default work schedule ─────────────────────────────────────────────

INSERT INTO work_schedules (name, check_in_time, check_out_time, late_threshold_minutes, timezone, is_default)
VALUES ('Default', '08:00', '17:00', 15, 'Asia/Jakarta', true)
ON CONFLICT DO NOTHING;
