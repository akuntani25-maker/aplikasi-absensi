export type UserRole = 'admin' | 'employee';
export type AttendanceType = 'check_in' | 'check_out';
export type AttendanceStatus = 'valid' | 'invalid_location' | 'invalid_face' | 'pending';
export type DailyStatus = 'present' | 'late' | 'absent' | 'half_day';

export interface Profile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  department: string | null;
  position: string | null;
  face_enrolled: boolean;
  face_descriptor: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Office {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  office_id: string | null;
  type: AttendanceType;
  status: AttendanceStatus;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number | null;
  location_valid: boolean | null;
  location_accuracy: number | null;
  is_mock_location: boolean | null;
  face_confidence: number | null;
  face_valid: boolean | null;
  liveness_passed: boolean | null;
  notes: string | null;
  created_at: string;
}

export interface DailyAttendance {
  id: string;
  employee_id: string;
  date: string;
  status: DailyStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_record_id: string | null;
  check_out_record_id: string | null;
  total_hours: number | null;
  created_at: string;
  updated_at: string;
  // joined
  profiles?: Pick<Profile, 'full_name' | 'employee_id' | 'department'>;
}

export interface DailyAttendanceWithProfile {
  id: string;
  employee_id: string;
  date: string;
  status: DailyStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_record_id: string | null;
  check_out_record_id: string | null;
  total_hours: number | null;
  created_at: string;
  updated_at: string;
  profiles: Pick<Profile, 'full_name' | 'employee_id' | 'department'> | null;
}

// Stats for dashboard
export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
}
