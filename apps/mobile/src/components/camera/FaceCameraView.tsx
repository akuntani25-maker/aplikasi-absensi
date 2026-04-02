import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { FaceOverlay } from './FaceOverlay';
import { LivenessChallengeView } from './LivenessChallenge';
import type { ChallengeStatus, FaceDetectionState, LivenessChallenge } from '../../hooks/useFaceDetection';

interface FaceCameraViewProps {
  cameraRef: React.RefObject<Camera | null>;
  frameProcessor: ReturnType<typeof import('react-native-vision-camera').useFrameProcessor>;
  faceState: FaceDetectionState['faceState'];
  challenge: LivenessChallenge;
  challengeStatus: ChallengeStatus;
  progress: number;
  onFaceDetectedForChallenge: () => void; // Dipanggil saat wajah stabil → mulai challenge
  onChallengePassed: () => void;          // Dipanggil saat kondisi liveness terpenuhi
  onRetry: () => void;
  device: ReturnType<typeof import('react-native-vision-camera').useCameraDevice>;
}

export function FaceCameraView({
  cameraRef,
  frameProcessor,
  faceState,
  challenge,
  challengeStatus,
  progress,
  onFaceDetectedForChallenge,
  onChallengePassed,
  onRetry,
  device,
}: FaceCameraViewProps) {
  // Trigger challenge saat wajah terstabil
  const challengeStartedRef = useRef(false);
  useEffect(() => {
    if (faceState.detected && challengeStatus === 'detecting' && !challengeStartedRef.current) {
      challengeStartedRef.current = true;
      onFaceDetectedForChallenge();
    }
    if (!faceState.detected) {
      challengeStartedRef.current = false;
    }
  }, [faceState.detected, challengeStatus]);

  // Cek apakah kondisi liveness terpenuhi
  useEffect(() => {
    if (challengeStatus !== 'challenge') return;
    if (!faceState.detected) return;

    let conditionMet = false;
    switch (challenge) {
      case 'blink':
        conditionMet =
          faceState.eyeOpenLeft < 0.3 && faceState.eyeOpenRight < 0.3;
        break;
      case 'turn_left':
        conditionMet = faceState.yaw < -20;
        break;
      case 'turn_right':
        conditionMet = faceState.yaw > 20;
        break;
      case 'smile':
        conditionMet = faceState.smile > 0.7;
        break;
    }

    if (conditionMet) {
      onChallengePassed();
    }
  }, [faceState, challenge, challengeStatus]);

  if (!device) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="white" />
        <Text className="text-white text-sm mt-3">Memuat kamera...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Kamera */}
      <Camera
        ref={cameraRef as React.RefObject<Camera>}
        style={{ flex: 1 }}
        device={device}
        isActive
        frameProcessor={frameProcessor}
        photo
        pixelFormat="yuv"
      />

      {/* Overlay gelap di sisi kiri/kanan oval */}
      <View className="absolute inset-0 items-center justify-start pt-[8%]">
        <FaceOverlay status={challengeStatus} />
      </View>

      {/* Challenge UI di bawah */}
      <View className="absolute bottom-0 left-0 right-0 pb-8 bg-black/50">
        <LivenessChallengeView
          challenge={challenge}
          status={challengeStatus}
          progress={progress}
        />

        {/* Tombol retry jika gagal */}
        {challengeStatus === 'failed' && (
          <TouchableOpacity
            onPress={onRetry}
            className="mx-6 mt-2 bg-white/20 rounded-2xl py-3 items-center"
          >
            <Text className="text-white font-semibold">Coba Lagi</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
