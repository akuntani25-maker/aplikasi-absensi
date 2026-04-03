import { create } from 'zustand'
import type { DailyAttendance } from '../types'

interface AttendanceState {
  /** Record absensi hari ini (null = belum ada / belum dimuat) */
  todayRecord: DailyAttendance | null

  /** Jumlah item di antrian offline */
  offlinePendingCount: number

  /** Apakah sedang ada proses check-in/out berlangsung */
  isSubmitting: boolean

  // Actions
  setTodayRecord: (record: DailyAttendance | null) => void
  setOfflinePendingCount: (count: number) => void
  setSubmitting: (submitting: boolean) => void
  reset: () => void
}

const initialState = {
  todayRecord: null,
  offlinePendingCount: 0,
  isSubmitting: false,
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  ...initialState,

  setTodayRecord: (todayRecord) => set({ todayRecord }),
  setOfflinePendingCount: (offlinePendingCount) => set({ offlinePendingCount }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  reset: () => set(initialState),
}))

// ─── Derived selectors ────────────────────────────────────────────────────────

/** Apakah sudah check-in hari ini */
export const selectHasCheckedIn = (s: AttendanceState) =>
  !!s.todayRecord?.check_in_time

/** Apakah sudah check-out hari ini */
export const selectHasCheckedOut = (s: AttendanceState) =>
  !!s.todayRecord?.check_out_time

/** Apakah hari ini sudah selesai (check-in & check-out) */
export const selectIsDone = (s: AttendanceState) =>
  !!s.todayRecord?.check_in_time && !!s.todayRecord?.check_out_time
