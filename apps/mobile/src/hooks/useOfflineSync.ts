import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from '../services/offlineQueue';
import { attendanceService } from '../services/attendanceService';

/**
 * Hook yang mendengarkan koneksi jaringan dan secara otomatis
 * mengirim ulang attendance records yang tersimpan offline.
 */
export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(() => offlineQueue.count());
  const isSyncing = useRef(false);

  const syncQueue = async () => {
    if (isSyncing.current) return;
    const items = offlineQueue.getAll();
    if (items.length === 0) return;

    isSyncing.current = true;
    for (const item of items) {
      try {
        await attendanceService.createRecord(item.payload);
        offlineQueue.remove(item.id);
      } catch {
        offlineQueue.incrementRetry(item.id);
      }
    }
    offlineQueue.purgeFailed();
    setPendingCount(offlineQueue.count());
    isSyncing.current = false;
  };

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
  }, []);

  return { pendingCount };
}
