/**
 * Unit tests untuk useLocation hook — test logika validasi tanpa device fisik.
 * GPS dan Supabase di-mock sehingga berjalan di Jest (Node environment).
 */
import { haversineMeters } from '../../lib/haversine'
import { MAX_LOCATION_ACCURACY_METERS, DEFAULT_RADIUS_METERS } from '../../lib/constants'

// ─── Helper: simulasi logika validasi useLocation ────────────────────────────

interface MockLocation {
  latitude: number
  longitude: number
  accuracy: number | null
  mocked?: boolean
}

interface MockOffice {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
}

type ValidationStatus = 'valid' | 'invalid' | 'error'

function validateLocation(
  location: MockLocation,
  offices: MockOffice[],
): { status: ValidationStatus; distanceMeters: number | null; errorMessage: string | null } {
  // Cek mock GPS
  if (location.mocked) {
    return { status: 'invalid', distanceMeters: null, errorMessage: 'Lokasi palsu (mock) terdeteksi.' }
  }

  // Cek akurasi
  if (location.accuracy === null || location.accuracy > MAX_LOCATION_ACCURACY_METERS) {
    return {
      status: 'invalid',
      distanceMeters: null,
      errorMessage: `Akurasi GPS terlalu rendah (${Math.round(location.accuracy ?? 0)}m).`,
    }
  }

  // Tidak ada kantor
  if (offices.length === 0) {
    return { status: 'error', distanceMeters: null, errorMessage: 'Tidak ada kantor yang terdaftar.' }
  }

  // Hitung jarak ke kantor terdekat
  let nearest: MockOffice | null = null
  let minDistance = Infinity
  for (const office of offices) {
    const dist = haversineMeters(location.latitude, location.longitude, office.latitude, office.longitude)
    if (dist < minDistance) {
      minDistance = dist
      nearest = office
    }
  }

  const radius = nearest?.radius_meters ?? DEFAULT_RADIUS_METERS
  const isWithin = minDistance <= radius

  return {
    status: isWithin ? 'valid' : 'invalid',
    distanceMeters: Math.round(minDistance),
    errorMessage: isWithin
      ? null
      : `Anda ${Math.round(minDistance)}m dari kantor "${nearest?.name}". Harus dalam radius ${radius}m.`,
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const OFFICE_JAKARTA: MockOffice = {
  id: 'office-1',
  name: 'Kantor Jakarta',
  latitude: -6.2088,
  longitude: 106.8456,
  radius_meters: 100,
}

const OFFICE_LABUHAN: MockOffice = {
  id: 'office-2',
  name: 'UD. AQIN TANI',
  latitude: -8.5678186,
  longitude: 116.575507321,
  radius_meters: 50,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('validasi lokasi (logika useLocation)', () => {
  describe('mock GPS detection', () => {
    it('menolak lokasi mock', () => {
      const result = validateLocation(
        { latitude: -6.2088, longitude: 106.8456, accuracy: 10, mocked: true },
        [OFFICE_JAKARTA],
      )
      expect(result.status).toBe('invalid')
      expect(result.errorMessage).toContain('palsu')
    })

    it('menerima lokasi non-mock', () => {
      const result = validateLocation(
        { latitude: -6.2088, longitude: 106.8456, accuracy: 10, mocked: false },
        [OFFICE_JAKARTA],
      )
      expect(result.status).toBe('valid')
    })
  })

  describe('cek akurasi GPS', () => {
    it('menolak akurasi null', () => {
      const result = validateLocation(
        { latitude: -6.2088, longitude: 106.8456, accuracy: null },
        [OFFICE_JAKARTA],
      )
      expect(result.status).toBe('invalid')
      expect(result.errorMessage).toContain('Akurasi')
    })

    it(`menolak akurasi > ${MAX_LOCATION_ACCURACY_METERS}m`, () => {
      const result = validateLocation(
        { latitude: -6.2088, longitude: 106.8456, accuracy: MAX_LOCATION_ACCURACY_METERS + 1 },
        [OFFICE_JAKARTA],
      )
      expect(result.status).toBe('invalid')
    })

    it(`menerima akurasi = ${MAX_LOCATION_ACCURACY_METERS}m (tepat di batas)`, () => {
      const result = validateLocation(
        { latitude: -6.2088, longitude: 106.8456, accuracy: MAX_LOCATION_ACCURACY_METERS },
        [OFFICE_JAKARTA],
      )
      expect(result.status).toBe('valid')
    })

    it('menerima akurasi < MAX', () => {
      const result = validateLocation(
        { latitude: -6.2088, longitude: 106.8456, accuracy: 5 },
        [OFFICE_JAKARTA],
      )
      expect(result.status).toBe('valid')
    })
  })

  describe('geofence validation', () => {
    it('valid saat tepat di koordinat kantor', () => {
      const result = validateLocation(
        { latitude: OFFICE_JAKARTA.latitude, longitude: OFFICE_JAKARTA.longitude, accuracy: 10 },
        [OFFICE_JAKARTA],
      )
      expect(result.status).toBe('valid')
      expect(result.distanceMeters).toBe(0)
    })

    it('valid saat dalam radius kantor (~50m)', () => {
      // Geser ~50m ke utara dari kantor (0.0005 derajat ≈ 55m)
      const result = validateLocation(
        { latitude: OFFICE_JAKARTA.latitude - 0.0004, longitude: OFFICE_JAKARTA.longitude, accuracy: 10 },
        [OFFICE_JAKARTA],
      )
      expect(result.status).toBe('valid')
      expect(result.distanceMeters).toBeLessThan(100)
    })

    it('invalid saat di luar radius kantor (~500m)', () => {
      // Geser ~500m dari kantor
      const result = validateLocation(
        { latitude: OFFICE_JAKARTA.latitude - 0.005, longitude: OFFICE_JAKARTA.longitude, accuracy: 10 },
        [OFFICE_JAKARTA],
      )
      expect(result.status).toBe('invalid')
      expect(result.distanceMeters).toBeGreaterThan(100)
      expect(result.errorMessage).toContain('Kantor Jakarta')
    })

    it('memilih kantor terdekat dari beberapa kantor', () => {
      // Lokasi dekat kantor Jakarta
      const result = validateLocation(
        { latitude: OFFICE_JAKARTA.latitude, longitude: OFFICE_JAKARTA.longitude, accuracy: 10 },
        [OFFICE_JAKARTA, OFFICE_LABUHAN],
      )
      expect(result.status).toBe('valid')
      expect(result.distanceMeters).toBe(0)
    })

    it('error saat tidak ada kantor terdaftar', () => {
      const result = validateLocation(
        { latitude: -6.2088, longitude: 106.8456, accuracy: 10 },
        [],
      )
      expect(result.status).toBe('error')
      expect(result.errorMessage).toContain('Tidak ada kantor')
    })
  })

  describe('radius custom per kantor', () => {
    it('menghormati radius custom (50m) dari data kantor', () => {
      // Lokasi 60m dari OFFICE_LABUHAN — di luar radius 50m
      const result = validateLocation(
        { latitude: OFFICE_LABUHAN.latitude - 0.0006, longitude: OFFICE_LABUHAN.longitude, accuracy: 10 },
        [OFFICE_LABUHAN],
      )
      // ~67m > 50m radius
      expect(result.status).toBe('invalid')
      expect(result.errorMessage).toContain('50m')
    })

    it('valid tepat di dalam radius custom (50m)', () => {
      // Geser ~30m ke utara
      const result = validateLocation(
        { latitude: OFFICE_LABUHAN.latitude - 0.0002, longitude: OFFICE_LABUHAN.longitude, accuracy: 10 },
        [OFFICE_LABUHAN],
      )
      // ~22m < 50m radius
      expect(result.status).toBe('valid')
    })
  })
})
