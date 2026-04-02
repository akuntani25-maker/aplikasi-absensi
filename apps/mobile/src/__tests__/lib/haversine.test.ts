import { haversineMeters } from '../../lib/haversine';

describe('haversineMeters', () => {
  it('mengembalikan 0 untuk koordinat yang sama', () => {
    const dist = haversineMeters(-6.2088, 106.8456, -6.2088, 106.8456);
    expect(dist).toBe(0);
  });

  it('menghitung jarak antara dua titik di Jakarta (~1.1 km)', () => {
    // Monas ke Bundaran HI — sekitar 1100m
    const dist = haversineMeters(
      -6.1754,  106.8272, // Monas
      -6.1944,  106.8229, // Bundaran HI
    );
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(2500);
  });

  it('mengembalikan nilai simetris (A→B = B→A)', () => {
    const distAB = haversineMeters(-6.2088, 106.8456, -6.1754, 106.8272);
    const distBA = haversineMeters(-6.1754, 106.8272, -6.2088, 106.8456);
    expect(distAB).toBeCloseTo(distBA, 5);
  });

  it('mengembalikan nilai positif', () => {
    const dist = haversineMeters(-6.2, 106.8, -6.3, 106.9);
    expect(dist).toBeGreaterThan(0);
  });

  it('mendeteksi jarak di dalam radius 100m', () => {
    // Dua titik berjarak ~50m
    const dist = haversineMeters(-6.2088, 106.8456, -6.2092, 106.8456);
    expect(dist).toBeLessThan(100);
  });

  it('mendeteksi jarak di luar radius 100m', () => {
    // Beda 0.01 derajat ≈ 1100m
    const dist = haversineMeters(-6.2088, 106.8456, -6.2188, 106.8456);
    expect(dist).toBeGreaterThan(100);
  });
});
