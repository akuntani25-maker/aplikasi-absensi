// ─── User & Auth ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  employeeId: string;
  departmentId: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "employee" | "supervisor" | "admin";

// ─── Attendance ──────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  userId: string;
  type: AttendanceType;
  timestamp: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  photoUrl?: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
}

export type AttendanceType = "check_in" | "check_out";
export type AttendanceStatus = "on_time" | "late" | "early_leave" | "absent";

// ─── Office Location ─────────────────────────────────────────────────────────

export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timezone: string;
  isActive: boolean;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}
