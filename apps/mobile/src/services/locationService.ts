import * as Location from 'expo-location';
import { getDistanceMeters } from '@absensi/shared';

export interface OfficeCoords {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface LocationValidationResult {
  is_valid: boolean;
  distance_meters: number;
  office_name: string;
  office_id: string;
  accuracy: number;
  is_mock: boolean;
  error?: string;
}

export const locationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation() {
    const granted = await this.requestPermission();
    if (!granted) {
      throw new Error('Izin lokasi tidak diberikan');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    return location;
  },

  async validateAgainstOffice(office: OfficeCoords): Promise<LocationValidationResult> {
    const location = await this.getCurrentLocation();
    const { latitude, longitude, accuracy } = location.coords;
    // mocked tidak ada di type LocationObjectCoords tapi tersedia di runtime Android
    const isMock = (location.coords as any).mocked === true;

    const distance = getDistanceMeters(latitude, longitude, office.latitude, office.longitude);
    const isAccurate = accuracy !== null && accuracy <= 50;
    const isWithinRadius = distance <= office.radius_meters;

    return {
      is_valid: isWithinRadius && !isMock && isAccurate,
      distance_meters: Math.round(distance),
      office_name: office.name,
      office_id: office.id,
      accuracy: Math.round(accuracy ?? 0),
      is_mock: isMock,
      error: isMock
        ? 'Lokasi palsu terdeteksi'
        : !isAccurate
        ? 'Akurasi GPS terlalu rendah'
        : !isWithinRadius
        ? `Anda berada ${Math.round(distance)}m dari kantor (radius: ${office.radius_meters}m)`
        : undefined,
    };
  },
};
