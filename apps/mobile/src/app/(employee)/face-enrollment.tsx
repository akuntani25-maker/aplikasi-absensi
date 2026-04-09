import { useState, useCallback } from 'react';
import { View, Text, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FaceCameraView } from '../../components/camera/FaceCameraView';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { faceService } from '../../services/faceService';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/useAuthStore';

type EnrollStep = 'guide' | 'camera' | 'uploading' | 'done';

export default function FaceEnrollmentScreen() {
  const router = useRouter();
  const { user, setProfile } = useAuthStore();
  const [step, setStep] = useState<EnrollStep>('guide');
  const [isUploading, setIsUploading] = useState(false);

  const {
    device,
    cameraRef,
    frameProcessor,
    state: faceDetState,
    askPermission,
    startChallenge,
    markChallengePassed,
    reset: resetFace,
  } = useFaceDetection();

  const handleStartCamera = useCallback(async () => {
    const granted = await askPermission();
    if (!granted) {
      Alert.alert(
        'Izin Kamera Diperlukan',
        'Aktifkan izin kamera di Pengaturan untuk mendaftarkan wajah.',
      );
      return;
    }
    setStep('camera');
  }, [askPermission]);

  const handleChallengePassed = useCallback(async () => {
    await markChallengePassed();
  }, [markChallengePassed]);

  // Setelah challenge passed → upload ke Supabase Edge Function
  const handleConfirmEnroll = useCallback(async () => {
    if (!faceDetState.capturedFrame) {
      Alert.alert('Foto tidak tersedia', 'Ambil foto ulang.');
      return;
    }

    setIsUploading(true);
    setStep('uploading');
    try {
      const result = await faceService.enrollFace([faceDetState.capturedFrame]);
      if (!result.success) throw new Error(result.message);

      // Refresh profile agar face_enrolled = true
      if (user) {
        const updated = await authService.getProfile(user.id);
        setProfile(updated);
      }

      setStep('done');
    } catch (err: any) {
      setIsUploading(false);
      setStep('camera');
      Alert.alert('Pendaftaran Gagal', err?.message ?? 'Terjadi kesalahan. Coba lagi.');
      resetFace();
    }
  }, [faceDetState.capturedFrame, user, setProfile, resetFace]);

  // ─── GUIDE STEP ────────────────────────────────────────────────────────────
  if (step === 'guide') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 py-8 justify-center gap-6">
          <View className="items-center gap-3">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center">
              <Text className="text-5xl">📸</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Daftarkan Wajah Anda
            </Text>
            <Text className="text-base text-gray-500 text-center leading-6">
              Wajah Anda akan digunakan untuk verifikasi setiap absensi. Lakukan sekali saja.
            </Text>
          </View>

          <Card className="gap-3">
            <Text className="text-sm font-semibold text-gray-700">Panduan:</Text>
            {[
              'Pastikan pencahayaan cukup dan merata',
              'Hadap langsung ke kamera',
              'Lepas kacamata jika memungkinkan',
              'Jangan gunakan masker atau penutup wajah',
            ].map((tip, i) => (
              <View key={i} className="flex-row items-start gap-2">
                <Text className="text-blue-600 font-bold">{i + 1}.</Text>
                <Text className="text-sm text-gray-600 flex-1">{tip}</Text>
              </View>
            ))}
          </Card>

          <Button
            label="Mulai Pendaftaran"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleStartCamera}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── UPLOADING STEP ────────────────────────────────────────────────────────
  if (step === 'uploading') {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-4">
        <Text className="text-5xl">⏳</Text>
        <Text className="text-lg font-semibold text-gray-800">Mendaftarkan wajah...</Text>
        <Text className="text-sm text-gray-500">Harap tunggu sebentar</Text>
      </SafeAreaView>
    );
  }

  // ─── DONE STEP ─────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-5 px-6">
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center">
          <Text className="text-5xl">✅</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center">Wajah Terdaftar!</Text>
        <Text className="text-base text-gray-500 text-center">
          Pendaftaran berhasil. Gunakan wajah Anda untuk absensi setiap hari.
        </Text>
        <Button
          label="Mulai Absensi"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.replace('/')}
        />
      </SafeAreaView>
    );
  }

  // ─── CAMERA STEP ──────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      <FaceCameraView
        cameraRef={cameraRef}
        frameProcessor={frameProcessor}
        faceState={faceDetState.faceState}
        challenge={faceDetState.challenge}
        challengeStatus={faceDetState.challengeStatus}
        progress={faceDetState.progress}
        device={device}
        onFaceDetectedForChallenge={startChallenge}
        onChallengePassed={handleChallengePassed}
        onRetry={resetFace}
      />

      {/* Tombol konfirmasi setelah challenge passed */}
      {faceDetState.challengeStatus === 'passed' && (
        <View className="absolute bottom-32 left-6 right-6">
          <Button
            label="Konfirmasi & Daftarkan Wajah"
            variant="primary"
            size="lg"
            fullWidth
            loading={isUploading}
            onPress={handleConfirmEnroll}
          />
        </View>
      )}

      {/* Tombol batal */}
      <SafeAreaView className="absolute top-0 left-0 right-0">
        <View className="px-4 pt-2">
          <Button
            label="Batal"
            variant="ghost"
            size="sm"
            onPress={() => setStep('guide')}
            className="self-start"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
