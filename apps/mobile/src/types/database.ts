// Auto-generated Supabase TypeScript types
// Regenerate with: npx supabase gen types typescript --project-id wluhsydchltflalkqewd

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance_records: {
        Row: {
          app_version: string | null
          created_at: string
          device_id: string | null
          device_model: string | null
          distance_meters: number | null
          employee_id: string
          face_confidence: number | null
          face_valid: boolean
          id: string
          is_mock_location: boolean
          latitude: number | null
          liveness_passed: boolean
          location_accuracy: number | null
          location_valid: boolean
          longitude: number | null
          notes: string | null
          office_id: string | null
          os_version: string | null
          status: Database['public']['Enums']['attendance_status']
          timestamp: string
          type: Database['public']['Enums']['attendance_type']
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          distance_meters?: number | null
          employee_id: string
          face_confidence?: number | null
          face_valid?: boolean
          id?: string
          is_mock_location?: boolean
          latitude?: number | null
          liveness_passed?: boolean
          location_accuracy?: number | null
          location_valid?: boolean
          longitude?: number | null
          notes?: string | null
          office_id?: string | null
          os_version?: string | null
          status?: Database['public']['Enums']['attendance_status']
          timestamp?: string
          type: Database['public']['Enums']['attendance_type']
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          distance_meters?: number | null
          employee_id?: string
          face_confidence?: number | null
          face_valid?: boolean
          id?: string
          is_mock_location?: boolean
          latitude?: number | null
          liveness_passed?: boolean
          location_accuracy?: number | null
          location_valid?: boolean
          longitude?: number | null
          notes?: string | null
          office_id?: string | null
          os_version?: string | null
          status?: Database['public']['Enums']['attendance_status']
          timestamp?: string
          type?: Database['public']['Enums']['attendance_type']
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_records_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_records_office_id_fkey'
            columns: ['office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      daily_attendance: {
        Row: {
          check_in_record_id: string | null
          check_in_time: string | null
          check_out_record_id: string | null
          check_out_time: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          status: Database['public']['Enums']['daily_status']
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          check_in_record_id?: string | null
          check_in_time?: string | null
          check_out_record_id?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          status?: Database['public']['Enums']['daily_status']
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          check_in_record_id?: string | null
          check_in_time?: string | null
          check_out_record_id?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          status?: Database['public']['Enums']['daily_status']
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'daily_attendance_check_in_record_id_fkey'
            columns: ['check_in_record_id']
            isOneToOne: false
            referencedRelation: 'attendance_records'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_attendance_check_out_record_id_fkey'
            columns: ['check_out_record_id']
            isOneToOne: false
            referencedRelation: 'attendance_records'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_attendance_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      employee_offices: {
        Row: {
          assigned_at: string
          employee_id: string
          id: string
          is_primary: boolean
          office_id: string
        }
        Insert: {
          assigned_at?: string
          employee_id: string
          id?: string
          is_primary?: boolean
          office_id: string
        }
        Update: {
          assigned_at?: string
          employee_id?: string
          id?: string
          is_primary?: boolean
          office_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'employee_offices_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_offices_office_id_fkey'
            columns: ['office_id']
            isOneToOne: false
            referencedRelation: 'offices'
            referencedColumns: ['id']
          },
        ]
      }
      offices: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          employee_id: string
          face_enrolled: boolean
          face_enrolled_at: string | null
          face_reference_id: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          position: string | null
          role: Database['public']['Enums']['user_role']
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          employee_id: string
          face_enrolled?: boolean
          face_enrolled_at?: string | null
          face_reference_id?: string | null
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          employee_id?: string
          face_enrolled?: boolean
          face_enrolled_at?: string | null
          face_reference_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          check_in_time: string
          check_out_time: string
          created_at: string
          id: string
          is_default: boolean
          late_threshold_minutes: number
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          check_in_time?: string
          check_out_time?: string
          created_at?: string
          id?: string
          is_default?: boolean
          late_threshold_minutes?: number
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string
          created_at?: string
          id?: string
          is_default?: boolean
          late_threshold_minutes?: number
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      attendance_status: 'valid' | 'invalid_location' | 'invalid_face' | 'pending'
      attendance_type: 'check_in' | 'check_out'
      daily_status: 'present' | 'late' | 'absent' | 'half_day'
      user_role: 'employee' | 'admin' | 'super_admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// Typed table rows
export type Profile         = Tables<'profiles'>
export type Office          = Tables<'offices'>
export type EmployeeOffice  = Tables<'employee_offices'>
export type AttendanceRecord = Tables<'attendance_records'>
export type DailyAttendance = Tables<'daily_attendance'>
export type WorkSchedule    = Tables<'work_schedules'>

// Typed enums
export type UserRole         = Enums<'user_role'>
export type AttendanceType   = Enums<'attendance_type'>
export type AttendanceStatus = Enums<'attendance_status'>
export type DailyStatus      = Enums<'daily_status'>
