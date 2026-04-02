import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { View, type ViewStyle } from 'react-native';
import { useEffect } from 'react';
import type { ChallengeStatus } from '../../hooks/useFaceDetection';

interface FaceOverlayProps {
  status: ChallengeStatus;
  style?: ViewStyle;
}

/**
 * Oval overlay di atas kamera untuk memandu posisi wajah.
 * Warna berubah sesuai status:
 *   no_face / detecting → abu (dashed)
 *   challenge            → biru (pulse)
 *   passed               → hijau
 *   failed               → merah
 */
export function FaceOverlay({ status, style }: FaceOverlayProps) {
  const opacity = useSharedValue(1);
  const scale   = useSharedValue(1);

  useEffect(() => {
    if (status === 'challenge') {
      opacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        false,
      );
      scale.value = withRepeat(
        withSequence(withTiming(1.03, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        false,
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value   = withTiming(1, { duration: 200 });
    }
  }, [status]);

  const borderColor =
    status === 'passed'
      ? '#16a34a'   // green-600
      : status === 'failed'
      ? '#dc2626'   // red-600
      : status === 'challenge'
      ? '#2563eb'   // blue-600
      : '#9ca3af';  // gray-400

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      style={[
        {
          position: 'absolute',
          alignSelf: 'center',
          top: '10%',
          width: 230,
          height: 290,
          borderRadius: 115,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            borderWidth: 3,
            borderColor,
            borderRadius: 115,
          },
          animStyle,
        ]}
      />
    </View>
  );
}
