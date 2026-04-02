import { View, Text, ActivityIndicator } from 'react-native';
import type { LocationState } from '../../hooks/useLocation';

interface LocationStatusProps {
  state: LocationState;
}

type StatusConfig = {
  bg: string;
  border: string;
  dot: string;
  icon: string;
  title: string;
};

const CONFIG: Record<LocationState['status'], StatusConfig> = {
  idle:    { bg: 'bg-gray-50',    border: 'border-gray-200',  dot: 'bg-gray-400',   icon: '📍', title: 'Belum dicek' },
  loading: { bg: 'bg-blue-50',   border: 'border-blue-200',  dot: 'bg-blue-500',   icon: '📡', title: 'Mengambil lokasi...' },
  valid:   { bg: 'bg-green-50',  border: 'border-green-300', dot: 'bg-green-500',  icon: '✅', title: 'Lokasi Valid' },
  invalid: { bg: 'bg-red-50',    border: 'border-red-300',   dot: 'bg-red-500',    icon: '❌', title: 'Lokasi Tidak Valid' },
  error:   { bg: 'bg-yellow-50', border: 'border-yellow-300',dot: 'bg-yellow-500', icon: '⚠️', title: 'Gagal' },
};

export function LocationStatus({ state }: LocationStatusProps) {
  const cfg = CONFIG[state.status];

  return (
    <View className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 gap-3`}>
      {/* Header */}
      <View className="flex-row items-center gap-2">
        {state.status === 'loading' ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <View className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        )}
        <Text className="text-sm font-semibold text-gray-800">{cfg.icon} {cfg.title}</Text>
      </View>

      {/* Detail valid */}
      {state.status === 'valid' && state.nearestOffice && (
        <View className="gap-1">
          <Text className="text-sm font-medium text-green-800">{state.nearestOffice.name}</Text>
          {state.distanceMeters !== null && (
            <Text className="text-xs text-green-700">
              Jarak: {state.distanceMeters}m dari kantor
              {state.accuracy !== null ? ` · Akurasi GPS: ±${Math.round(state.accuracy)}m` : ''}
            </Text>
          )}
        </View>
      )}

      {/* Error/invalid message */}
      {(state.status === 'invalid' || state.status === 'error') && state.errorMessage && (
        <Text className="text-xs text-red-700 leading-5">{state.errorMessage}</Text>
      )}

      {/* Mock location warning */}
      {state.isMock && (
        <View className="bg-red-100 rounded-xl px-3 py-2">
          <Text className="text-xs font-semibold text-red-700">
            🚫 Fake GPS terdeteksi — Absensi diblokir
          </Text>
        </View>
      )}
    </View>
  );
}
