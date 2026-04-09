import { View, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

interface OfflineBannerProps {
  pendingCount: number;
}

/**
 * Banner tipis di atas layar yang muncul saat ada antrian offline.
 * Hilang otomatis saat pendingCount = 0.
 */
export function OfflineBanner({ pendingCount }: OfflineBannerProps) {
  if (pendingCount === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className="bg-yellow-500 px-4 py-2 flex-row items-center justify-center gap-2"
    >
      <Text className="text-white text-xs font-semibold">
        📶 {pendingCount} absensi menunggu sinkronisasi
      </Text>
    </Animated.View>
  );
}
