import { useEffect, useRef, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from '../services/offlineQueue';
import { attendanceService } from '../services/attendanceService';

/**
 * Mendengarkan koneksi jaringan dan secara otomatis mengirim ulang
 * attendance records yang tersimpan offline.
 *
 * Catatan: record offline dikirim dengan status='valid' (bukan 'pending')
 * agar DB trigger process_attendance() berjalan dan daily_attendance terupdate.
 */
export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(() => offlineQueue.count());
  const isSyncing = useRef(false);

  const syncQueue = useCallback(async () => {
    if (isSyncing.current) return;
    const items = offlineQueue.getAll();
    if (items.length === 0) return;

    isSyncing.current = true;
    for (const item of items) {
      try {
        // Override status ke 'valid' agar DB trigger process_attendance() aktif
        await attendanceService.createRecord({ ...item.payload, status: 'valid' });
        offlineQueue.remove(item.id);
      } catch {
        offlineQueue.incrementRetry(item.id);
      }
    }
    offlineQueue.purgeFailed();
    setPendingCount(offlineQueue.count());
    isSyncing.current = false;
  }, []);

  useEffect(() => {
    // Sync saat pertama mount jika online
    NetInfo.fetch().then((state) => {
      if (state.isConnected) syncQueue();
    });

    // Sync setiap kali koneksi kembali
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) syncQueue();
    });

    return () => unsubscribe();
  }, [syncQueue]);

  return { pendingCount, syncQueue };
}
