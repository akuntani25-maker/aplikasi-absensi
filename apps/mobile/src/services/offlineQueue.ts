import { MMKV } from 'react-native-mmkv';
import type { AttendanceInsert } from './attendanceService';

const storage = new MMKV({ id: 'offline-queue' });
const QUEUE_KEY = 'attendance_queue';

export interface QueuedAttendance {
  id: string;             // idempotency key (uuid-like timestamp)
  payload: AttendanceInsert;
  queuedAt: string;       // ISO timestamp saat di-queue
  retries: number;
}

function readQueue(): QueuedAttendance[] {
  try {
    const raw = storage.getString(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAttendance[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAttendance[]): void {
  storage.set(QUEUE_KEY, JSON.stringify(queue));
}

export const offlineQueue = {
  /** Tambah record ke antrian offline */
  push(payload: AttendanceInsert): string {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item: QueuedAttendance = { id, payload, queuedAt: new Date().toISOString(), retries: 0 };
    const queue = readQueue();
    queue.push(item);
    writeQueue(queue);
    return id;
  },

  /** Ambil semua item di antrian */
  getAll(): QueuedAttendance[] {
    return readQueue();
  },

  /** Hapus item setelah berhasil di-sync */
  remove(id: string): void {
    const queue = readQueue().filter((item) => item.id !== id);
    writeQueue(queue);
  },

  /** Tambah counter retry */
  incrementRetry(id: string): void {
    const queue = readQueue().map((item) =>
      item.id === id ? { ...item, retries: item.retries + 1 } : item,
    );
    writeQueue(queue);
  },

  /** Hapus item yang sudah gagal terlalu banyak (>5 kali) */
  purgeFailed(): void {
    const queue = readQueue().filter((item) => item.retries <= 5);
    writeQueue(queue);
  },

  count(): number {
    return readQueue().length;
  },
};
