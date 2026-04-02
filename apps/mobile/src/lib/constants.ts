// Konfigurasi app
export const APP_NAME = 'Absensi';
export const APP_TAGLINE = 'Sistem Absensi Karyawan';

// Konfigurasi geofencing
export const DEFAULT_RADIUS_METERS = 100;
export const MAX_LOCATION_ACCURACY_METERS = 50;

// Face recognition
export const FACE_CONFIDENCE_THRESHOLD = 0.95; // 95%
export const LIVENESS_EYE_OPEN_THRESHOLD = 0.3;
export const LIVENESS_FRAMES_REQUIRED = 15;

// Query keys
export const QUERY_KEYS = {
  profile: ['profile'],
  offices: ['offices'],
  attendance: ['attendance'],
  dailyAttendance: ['daily-attendance'],
  weeklySummary: ['weekly-summary'],
} as const;

// Warna (sesuai tailwind.config)
export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
  },
} as const;
