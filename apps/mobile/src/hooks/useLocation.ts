import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { QUERY_KEYS, DEFAULT_RADIUS_METERS, MAX_LOCATION_ACCURACY_METERS } from '../lib/constants';
import { haversineMeters } from '../lib/haversine';

export interface Office {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface LocationState {
  status: 'idle' | 'loading' | 'valid' | 'invalid' | 'error';
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isMock: boolean;
  distanceMeters: number | null;
  nearestOffice: Office | null;
  errorMessage: string | null;
}


async function fetchMyOffices(): Promise<Office[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Tidak ada sesi aktif');

  // Coba ambil offices yang ditugaskan ke user
  const { data: assigned, error: assignedError } = await supabase
    .from('employee_offices')
    .select('office_id, offices(*)')
    .eq('employee_id', user.id);

  if (!assignedError && assigned && assigned.length > 0) {
    return assigned
      .map((row: any) => row.offices)
      .filter(Boolean)
      .filter((o: Office) => o.radius_meters > 0);
  }

  // Fallback: semua kantor aktif
  const { data: allOffices, error } = await supabase
    .from('offices')
    .select('*')
    .eq('is_active', true);
  if (error) throw error;
  return allOffices ?? [];
}

export function useMyOffices() {
  return useQuery({
    queryKey: QUERY_KEYS.offices,
    queryFn: fetchMyOffices,
    staleTime: 1000 * 60 * 10, // 10 menit
  });
}

const INITIAL_STATE: LocationState = {
  status: 'idle',
  latitude: null,
  longitude: null,
  accuracy: null,
  isMock: false,
  distanceMeters: null,
  nearestOffice: null,
  errorMessage: null,
};

export function useLocation() {
  const [state, setState] = useState<LocationState>(INITIAL_STATE);
  const { data: offices = [] } = useMyOffices();

  const validate = useCallback(async (): Promise<LocationState> => {
    setState((s) => ({ ...s, status: 'loading', errorMessage: null }));

    try {
      // 1. Minta izin lokasi
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const next: LocationState = {
          ...INITIAL_STATE,
          status: 'error',
          errorMessage: 'Izin akses lokasi tidak diberikan. Aktifkan di pengaturan.',
        };
        setState(next);
        return next;
      }

      // 2. Ambil lokasi dengan akurasi tinggi
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const { latitude, longitude, accuracy } = location.coords;
      const isMock = (location.coords as any).mocked === true;

      // 3. Cek lokasi palsu
      if (isMock) {
        const next: LocationState = {
          ...INITIAL_STATE,
          status: 'invalid',
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          isMock: true,
          errorMessage: 'Lokasi palsu (mock) terdeteksi. Absensi tidak dapat dilakukan.',
        };
        setState(next);
        return next;
      }

      // 4. Cek akurasi GPS
      if (accuracy === null || accuracy > MAX_LOCATION_ACCURACY_METERS) {
        const next: LocationState = {
          ...INITIAL_STATE,
          status: 'invalid',
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          isMock: false,
          errorMessage: `Akurasi GPS terlalu rendah (${Math.round(accuracy ?? 0)}m). Pindah ke area terbuka.`,
        };
        setState(next);
        return next;
      }

      // 5. Tidak ada kantor terdaftar
      if (offices.length === 0) {
        const next: LocationState = {
          ...INITIAL_STATE,
          status: 'error',
          latitude,
          longitude,
          accuracy,
          isMock: false,
          errorMessage: 'Tidak ada kantor yang terdaftar. Hubungi admin.',
        };
        setState(next);
        return next;
      }

      // 6. Hitung jarak ke setiap kantor, ambil yang terdekat
      let nearest: Office | null = null;
      let minDistance = Infinity;

      for (const office of offices) {
        const dist = haversineMeters(latitude, longitude, office.latitude, office.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = office;
        }
      }

      const radius = nearest?.radius_meters ?? DEFAULT_RADIUS_METERS;
      const isWithin = minDistance <= radius;

      const next: LocationState = {
        status: isWithin ? 'valid' : 'invalid',
        latitude,
        longitude,
        accuracy,
        isMock: false,
        distanceMeters: Math.round(minDistance),
        nearestOffice: nearest,
        errorMessage: isWithin
          ? null
          : `Anda ${Math.round(minDistance)}m dari kantor "${nearest?.name}". Harus dalam radius ${radius}m.`,
      };
      setState(next);
      return next;
    } catch (err: any) {
      const next: LocationState = {
        ...INITIAL_STATE,
        status: 'error',
        errorMessage: err?.message ?? 'Gagal mendapatkan lokasi.',
      };
      setState(next);
      return next;
    }
  }, [offices]);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { state, validate, reset };
}
