import { supabase } from './supabase';

export interface AttendanceInsert {
  employee_id: string;
  office_id?: string | null;
  type: 'check_in' | 'check_out';
  status?: 'valid' | 'invalid_location' | 'invalid_face' | 'pending';
  latitude?: number | null;
  longitude?: number | null;
  distance_meters?: number | null;
  location_valid?: boolean;
  location_accuracy?: number | null;
  is_mock_location?: boolean;
  face_confidence?: number | null;
  face_valid?: boolean;
  liveness_passed?: boolean;
  device_id?: string | null;
  device_model?: string | null;
  os_version?: string | null;
  app_version?: string | null;
  notes?: string | null;
}

export const attendanceService = {
  async createRecord(data: AttendanceInsert) {
    const { data: record, error } = await supabase
      .from('attendance_records')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return record;
  },

  async getMyAttendance(options?: { limit?: number; offset?: number }) {
    let query = supabase
      .from('attendance_records')
      .select('*')
      .order('timestamp', { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, (options.offset + (options.limit ?? 20)) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getMyDailyAttendance(date?: string) {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_attendance')
      .select('*')
      .eq('date', targetDate)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getTodayStatus(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Ambil riwayat daily_attendance dengan pagination.
   * page dimulai dari 0.
   */
  async getDailyHistory(options: { page?: number; perPage?: number } = {}) {
    const page    = options.page    ?? 0;
    const perPage = options.perPage ?? 20;
    const from    = page * perPage;
    const to      = from + perPage - 1;

    const { data, error, count } = await supabase
      .from('daily_attendance')
      .select('*, attendance_records!check_in_record_id(office_id, offices(name))', { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },

  /**
   * Ambil ringkasan 5 hari kerja terakhir (Sen–Jum minggu ini).
   */
  async getWeeklySummary() {
    const now   = new Date();
    const day   = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Senin minggu ini
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1));
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('daily_attendance')
      .select('date, status, check_in_time, check_out_time, total_hours')
      .gte('date', monday.toISOString().split('T')[0])
      .lte('date', friday.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },
};
