import { offlineQueue } from '../../services/offlineQueue';
import type { AttendanceInsert } from '../../services/attendanceService';
import { MMKV } from 'react-native-mmkv';

const SAMPLE_PAYLOAD: AttendanceInsert = {
  employee_id: 'user-123',
  type: 'check_in',
  status: 'pending',
  latitude: -6.2088,
  longitude: 106.8456,
  location_valid: true,
  face_valid: true,
  liveness_passed: true,
};

beforeEach(() => {
  // Reset mock store antara setiap test
  (MMKV as jest.Mock).mockClear();
  // Instantiasi ulang storage dengan store bersih — re-import module
  jest.resetModules();
});

describe('offlineQueue', () => {
  it('push menambahkan item ke queue', () => {
    const { offlineQueue: q } = require('../../services/offlineQueue');
    q.push(SAMPLE_PAYLOAD);
    expect(q.getAll()).toHaveLength(1);
    expect(q.getAll()[0]?.payload.employee_id).toBe('user-123');
  });

  it('push mengembalikan id string', () => {
    const { offlineQueue: q } = require('../../services/offlineQueue');
    const id = q.push(SAMPLE_PAYLOAD);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('remove menghapus item berdasarkan id', () => {
    const { offlineQueue: q } = require('../../services/offlineQueue');
    const id = q.push(SAMPLE_PAYLOAD);
    q.remove(id);
    expect(q.getAll()).toHaveLength(0);
  });

  it('push dua item mempertahankan keduanya', () => {
    const { offlineQueue: q } = require('../../services/offlineQueue');
    q.push(SAMPLE_PAYLOAD);
    q.push({ ...SAMPLE_PAYLOAD, type: 'check_out' });
    expect(q.getAll()).toHaveLength(2);
  });

  it('item baru memiliki retries = 0', () => {
    const { offlineQueue: q } = require('../../services/offlineQueue');
    q.push(SAMPLE_PAYLOAD);
    expect(q.getAll()[0]?.retries).toBe(0);
  });

  it('incrementRetry menambah counter retries', () => {
    const { offlineQueue: q } = require('../../services/offlineQueue');
    const id = q.push(SAMPLE_PAYLOAD);
    q.incrementRetry(id);
    q.incrementRetry(id);
    const item = q.getAll().find((i: { id: string }) => i.id === id);
    expect(item?.retries).toBe(2);
  });

  it('purgeFailed menghapus item dengan retries > 5', () => {
    const { offlineQueue: q } = require('../../services/offlineQueue');
    const id = q.push(SAMPLE_PAYLOAD);
    for (let i = 0; i < 6; i++) q.incrementRetry(id);
    q.purgeFailed();
    expect(q.getAll()).toHaveLength(0);
  });

  it('purgeFailed mempertahankan item dengan retries <= 5', () => {
    const { offlineQueue: q } = require('../../services/offlineQueue');
    const id = q.push(SAMPLE_PAYLOAD);
    for (let i = 0; i < 5; i++) q.incrementRetry(id);
    q.purgeFailed();
    expect(q.getAll()).toHaveLength(1);
  });

  it('count mengembalikan jumlah item', () => {
    const { offlineQueue: q } = require('../../services/offlineQueue');
    q.push(SAMPLE_PAYLOAD);
    q.push(SAMPLE_PAYLOAD);
    expect(q.count()).toBe(2);
  });
});
