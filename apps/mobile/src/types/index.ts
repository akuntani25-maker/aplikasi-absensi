// Re-export database types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  Profile,
  Office,
  EmployeeOffice,
  AttendanceRecord,
  DailyAttendance,
  WorkSchedule,
  UserRole,
  AttendanceType,
  AttendanceStatus,
  DailyStatus,
} from './database'

// ─── App-Level Types ──────────────────────────────────────────────────────────

/** Koordinat GPS */
export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

/** Hasil validasi lokasi */
export interface LocationValidation {
  isValid: boolean
  isMock: boolean
  distanceMeters: number | null
  accuracy: number | null
  errorMessage: string | null
}

/** Tipe absensi untuk UI */
export type CheckInType = 'check_in' | 'check_out'

/** Status langkah di flow absensi */
export type CheckInStep = 'location' | 'face' | 'submitting' | 'done'

/** API response wrapper generik */
export interface ApiResult<T> {
  data: T | null
  error: string | null
}
