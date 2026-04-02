import { useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import { attendanceService, type AttendanceInsert } from '../services/attendanceService';
import { faceService } from '../services/faceService';
import { offlineQueue } from '../services/offlineQueue';
import type { LocationState } from './useLocation';
import { QUERY_KEYS } from '../lib/constants';

export type AttendanceSubmitStatus =
  | 'idle'
  | 'verifying_face'
  | 'saving'
  | 'success'
  | 'offline_queued'
  | 'error';

export interface AttendanceSubmitResult {
  status: AttendanceSubmitStatus;
  error?: string;
  isOffline?: boolean;
}

interface SubmitCheckInParams {
  type: 'check_in' | 'check_out';
  locationState: LocationState;
  capturedFrame: string;
  livenessOk: boolean;
  faceConfidence?: number; // sudah diverifikasi di komponen, opsional skip verify
}

export function useAttendance() {
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [submitStatus, setSubmitStatus] = useState<AttendanceSubmitStatus>('idle');

  const submit = useCallback(
    async (params: SubmitCheckInParams): Promise<AttendanceSubmitResult> => {
      if (!profile || !params.locationState.nearestOffice) {
        return { status: 'error', error: 'Data profil atau kantor tidak tersedia.' };
      }

      const network = await NetInfo.fetch();
      const isOnline = network.isConnected === true;

      const baseRecord: AttendanceInsert = {
        employee_id: profile.id,
        office_id: params.locationState.nearestOffice.id,
        type: params.type,
        latitude:         params.locationState.latitude  ?? undefined,
        longitude:        params.locationState.longitude ?? undefined,
        distance_meters:  params.locationState.distanceMeters ?? undefined,
        location_valid:   true,
        location_accuracy: params.locationState.accuracy ?? undefined,
        is_mock_location: false,
        liveness_passed:  params.livenessOk,
      };

      // ── Online: verifikasi wajah + simpan langsung ────────────────────────
      if (isOnline) {
        try {
          setSubmitStatus('verifying_face');

          let faceValid = false;
          let faceConfidence = 0;

          if (params.faceConfidence !== undefined) {
            // Confidence sudah diketahui dari luar
            faceValid = params.faceConfidence >= 0.75;
            faceConfidence = params.faceConfidence;
          } else if (profile.face_reference_id) {
            const verifyResult = await faceService.verifyFace(
              params.capturedFrame,
              profile.face_reference_id,
            );
            faceValid = verifyResult.match;
            faceConfidence = verifyResult.confidence;
          }

          if (!faceValid) {
            setSubmitStatus('error');
            return { status: 'error', error: 'Wajah tidak cocok. Coba lagi.' };
          }

          setSubmitStatus('saving');
          await attendanceService.createRecord({
            ...baseRecord,
            status: 'valid',
            face_valid: true,
            face_confidence: faceConfidence,
          });

          // Invalidate TanStack Query cache agar home + history refresh
          await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyAttendance });
          await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance });

          setSubmitStatus('success');
          return { status: 'success' };
        } catch (err: any) {
          setSubmitStatus('error');
          return { status: 'error', error: err?.message ?? 'Gagal menyimpan absensi.' };
        }
      }

      // ── Offline: simpan ke MMKV queue ─────────────────────────────────────
      setSubmitStatus('saving');
      offlineQueue.push({
        ...baseRecord,
        status: 'pending',
        face_valid: params.livenessOk,
        face_confidence: params.faceConfidence ?? null,
        notes: 'Offline — akan di-sync saat koneksi tersedia',
      });

      setSubmitStatus('offline_queued');
      return { status: 'offline_queued', isOffline: true };
    },
    [profile, queryClient],
  );

  const reset = useCallback(() => setSubmitStatus('idle'), []);

  return { submitStatus, submit, reset };
}
