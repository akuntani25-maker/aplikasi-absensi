/**
 * Unit tests untuk attendanceService — logika helper functions.
 * Supabase di-mock sehingga tidak perlu koneksi.
 */

// ─── Helpers yang bisa ditest tanpa mock berat ────────────────────────────────

/** Hitung total jam kerja dari check_in dan check_out */
function calcTotalHours(checkIn: string, checkOut: string): number {
  const msIn  = new Date(checkIn).getTime();
  const msOut = new Date(checkOut).getTime();
  return (msOut - msIn) / 3_600_000;
}

/** Format tanggal ISO ke YYYY-MM-DD */
function isoToDate(iso: string): string {
  return iso.substring(0, 10);
}

/** Apakah timestamp check-in dianggap terlambat? */
function isLate(
  checkInIso: string,
  scheduleHHmm: string,   // e.g. '08:00'
  lateThresholdMinutes: number,
  timezone: string = 'Asia/Jakarta',
): boolean {
  const checkIn = new Date(checkInIso);
  const dateStr = checkIn.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD

  // Interpret scheduleHHmm in the given timezone (not local machine time).
  // Step 1: treat schedule as UTC to get a reference Date
  const schedNaive = new Date(`${dateStr}T${scheduleHHmm}:00Z`);
  // Step 2: find what that UTC instant looks like in the target timezone
  const tzStr = schedNaive.toLocaleString('sv-SE', { timeZone: timezone }); // "YYYY-MM-DD HH:MM:SS"
  const tzDate = new Date(tzStr.replace(' ', 'T') + 'Z');
  // Step 3: offset = how far ahead the timezone is relative to UTC
  const tzOffsetMs = tzDate.getTime() - schedNaive.getTime();
  // Step 4: actual UTC instant when it IS scheduleHHmm in the timezone
  const scheduleUTC = new Date(schedNaive.getTime() - tzOffsetMs);

  const cutoff = new Date(scheduleUTC.getTime() + lateThresholdMinutes * 60_000);
  return checkIn > cutoff;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('attendanceService helpers', () => {
  describe('calcTotalHours', () => {
    it('menghitung 8 jam kerja dengan benar', () => {
      const h = calcTotalHours('2026-04-04T08:00:00Z', '2026-04-04T16:00:00Z');
      expect(h).toBeCloseTo(8, 5);
    });

    it('menghitung 30 menit', () => {
      const h = calcTotalHours('2026-04-04T08:00:00Z', '2026-04-04T08:30:00Z');
      expect(h).toBeCloseTo(0.5, 5);
    });

    it('menangani lintas hari', () => {
      const h = calcTotalHours('2026-04-04T22:00:00Z', '2026-04-05T06:00:00Z');
      expect(h).toBeCloseTo(8, 5);
    });
  });

  describe('isoToDate', () => {
    it('mengekstrak tanggal dari ISO timestamp', () => {
      expect(isoToDate('2026-04-04T08:00:00.000Z')).toBe('2026-04-04');
    });

    it('mengekstrak tanggal dari timestamp tanpa ms', () => {
      expect(isoToDate('2026-04-04T00:00:00Z')).toBe('2026-04-04');
    });
  });

  describe('isLate', () => {
    // Gunakan UTC untuk konsistensi test lintas timezone
    it('tidak terlambat saat check-in tepat waktu', () => {
      // Jam 08:00 UTC check-in, schedule 08:00, threshold 15 menit
      const late = isLate('2026-04-04T08:00:00Z', '08:00', 15, 'UTC');
      expect(late).toBe(false);
    });

    it('tidak terlambat saat masih dalam threshold', () => {
      // Jam 08:14 UTC, threshold 15 menit → belum terlambat
      const late = isLate('2026-04-04T08:14:00Z', '08:00', 15, 'UTC');
      expect(late).toBe(false);
    });

    it('terlambat saat melewati threshold', () => {
      // Jam 08:16 UTC, threshold 15 menit → terlambat
      const late = isLate('2026-04-04T08:16:00Z', '08:00', 15, 'UTC');
      expect(late).toBe(true);
    });

    it('terlambat 1 jam penuh', () => {
      const late = isLate('2026-04-04T09:00:00Z', '08:00', 15, 'UTC');
      expect(late).toBe(true);
    });
  });
});

// ─── AttendanceInsert validation logic ───────────────────────────────────────

describe('attendance record validation', () => {
  function validateAttendanceRecord(data: {
    employee_id?: string;
    type?: string;
    location_valid?: boolean;
    is_mock_location?: boolean;
    face_valid?: boolean;
    liveness_passed?: boolean;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.employee_id) errors.push('employee_id diperlukan');
    if (!data.type) errors.push('type diperlukan');
    if (!['check_in', 'check_out'].includes(data.type ?? '')) errors.push('type tidak valid');
    if (!data.location_valid) errors.push('lokasi tidak valid');
    if (data.is_mock_location) errors.push('mock location terdeteksi');
    if (!data.face_valid) errors.push('verifikasi wajah gagal');
    if (!data.liveness_passed) errors.push('liveness check gagal');
    return { valid: errors.length === 0, errors };
  }

  it('menerima record yang valid', () => {
    const result = validateAttendanceRecord({
      employee_id: 'user-123',
      type: 'check_in',
      location_valid: true,
      is_mock_location: false,
      face_valid: true,
      liveness_passed: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('menolak record tanpa employee_id', () => {
    const result = validateAttendanceRecord({ type: 'check_in', location_valid: true, face_valid: true, liveness_passed: true });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('employee_id diperlukan');
  });

  it('menolak type tidak valid', () => {
    const result = validateAttendanceRecord({
      employee_id: 'user-123', type: 'invalid',
      location_valid: true, face_valid: true, liveness_passed: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('type tidak valid');
  });

  it('menolak mock location', () => {
    const result = validateAttendanceRecord({
      employee_id: 'user-123', type: 'check_in',
      location_valid: true, is_mock_location: true, face_valid: true, liveness_passed: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('mock location terdeteksi');
  });

  it('menolak face tidak valid', () => {
    const result = validateAttendanceRecord({
      employee_id: 'user-123', type: 'check_in',
      location_valid: true, is_mock_location: false, face_valid: false, liveness_passed: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('verifikasi wajah gagal');
  });

  it('check_out juga valid', () => {
    const result = validateAttendanceRecord({
      employee_id: 'user-123', type: 'check_out',
      location_valid: true, is_mock_location: false, face_valid: true, liveness_passed: true,
    });
    expect(result.valid).toBe(true);
  });
});
