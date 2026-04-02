-- ============================================================
-- Migration: 002_rls_policies
-- Row Level Security policies
-- ============================================================

-- Enable RLS
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_offices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules     ENABLE ROW LEVEL SECURITY;

-- ─── Helper: cek apakah user adalah admin ────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── PROFILES ────────────────────────────────────────────────────────────────

CREATE POLICY "user_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "admin_read_all_profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "user_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_update_any_profile"
  ON profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "admin_insert_profile"
  ON profiles FOR INSERT
  WITH CHECK (is_admin());

-- ─── OFFICES ─────────────────────────────────────────────────────────────────

CREATE POLICY "auth_read_active_offices"
  ON offices FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "admin_manage_offices"
  ON offices FOR ALL
  USING (is_admin());

-- ─── EMPLOYEE_OFFICES ─────────────────────────────────────────────────────────

CREATE POLICY "user_read_own_assignments"
  ON employee_offices FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "admin_manage_assignments"
  ON employee_offices FOR ALL
  USING (is_admin());

-- ─── ATTENDANCE_RECORDS ───────────────────────────────────────────────────────

CREATE POLICY "user_read_own_attendance"
  ON attendance_records FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "user_insert_own_attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admin_read_all_attendance"
  ON attendance_records FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_update_attendance"
  ON attendance_records FOR UPDATE
  USING (is_admin());

-- ─── DAILY_ATTENDANCE ─────────────────────────────────────────────────────────

CREATE POLICY "user_read_own_daily"
  ON daily_attendance FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "admin_read_all_daily"
  ON daily_attendance FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_manage_daily"
  ON daily_attendance FOR ALL
  USING (is_admin());

-- ─── WORK_SCHEDULES ───────────────────────────────────────────────────────────

CREATE POLICY "auth_read_schedules"
  ON work_schedules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admin_manage_schedules"
  ON work_schedules FOR ALL
  USING (is_admin());
