import { View, Text } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import type { LivenessChallenge, ChallengeStatus } from '../../hooks/useFaceDetection';

interface LivenessChallengeProps {
  challenge: LivenessChallenge;
  status: ChallengeStatus;
  progress: number; // 0..1
}

const CHALLENGE_INFO: Record<LivenessChallenge, { icon: string; instruction: string }> = {
  blink:      { icon: '👁️',  instruction: 'Kedipkan mata Anda' },
  turn_left:  { icon: '⬅️',  instruction: 'Toleh kepala ke kiri' },
  turn_right: { icon: '➡️',  instruction: 'Toleh kepala ke kanan' },
  smile:      { icon: '😊',  instruction: 'Senyum selebar mungkin' },
};

const STATUS_INFO: Partial<Record<ChallengeStatus, { text: string; color: string }>> = {
  waiting:   { text: 'Menunggu kamera...',   color: 'text-gray-400' },
  detecting: { text: 'Posisikan wajah Anda dalam oval', color: 'text-blue-300' },
  no_face:   { text: 'Wajah tidak terdeteksi', color: 'text-yellow-400' },
  passed:    { text: 'Verifikasi berhasil ✓', color: 'text-green-400' },
  failed:    { text: 'Waktu habis. Coba lagi.', color: 'text-red-400' },
};

export function LivenessChallengeView({ challenge, status, progress }: LivenessChallengeProps) {
  const info = CHALLENGE_INFO[challenge];
  const statusInfo = STATUS_INFO[status];
  const showChallenge = status === 'challenge' || status === 'passed';

  return (
    <View className="items-center gap-3 px-6 py-4">
      {/* Status text */}
      {statusInfo && (
        <Animated.Text
          entering={FadeInDown.duration(300)}
          exiting={FadeOut.duration(200)}
          className={`text-sm font-medium ${statusInfo.color}`}
        >
          {statusInfo.text}
        </Animated.Text>
      )}

      {/* Challenge instruction */}
      {showChallenge && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="items-center gap-2"
        >
          <Text className="text-4xl">{info.icon}</Text>
          <Text className="text-white text-base font-semibold text-center">
            {info.instruction}
          </Text>
        </Animated.View>
      )}

      {/* Progress bar */}
      {(status === 'challenge') && (
        <View className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
          <Animated.View
            className="h-full bg-blue-400 rounded-full"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
      )}

      {/* Passed indicator */}
      {status === 'passed' && (
        <Animated.View
          entering={FadeInDown.springify()}
          className="w-14 h-14 bg-green-500 rounded-full items-center justify-center"
        >
          <Text className="text-white text-2xl font-bold">✓</Text>
        </Animated.View>
      )}
    </View>
  );
}
