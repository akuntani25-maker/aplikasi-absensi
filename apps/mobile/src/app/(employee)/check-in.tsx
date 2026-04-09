import { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LocationStatus } from '../../components/attendance/LocationStatus';
import { FaceCameraView } from '../../components/camera/FaceCameraView';
import { useLocation } from '../../hooks/useLocation';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { useAttendance } from '../../hooks/useAttendance';
import { useAuthStore } from '../../stores/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckType = 'check_in' | 'check_out';
type ScreenStep = 'location' | 'face' | 'submitting' | 'done' | 'offline_queued';

// ─── Step badge ───────────────────────────────────────────────────────────────

function StepBadge({ current, step }: { current: ScreenStep; step: ScreenStep }) {
  const ORDER: ScreenStep[] = ['location', 'face', 'submitting', 'done'];
  const ci = ORDER.indexOf(current);
  const si = ORDER.indexOf(step);
  if (si < ci) return <Badge label="✓ Selesai" variant="success" />;
  if (si === ci) return <Badge label="Aktif" variant="info" />;
  return <Badge label="Menunggu" variant="neutral" />;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CheckInScreen() {
  const router = useRouter();
  const { type: typeParam } = useLocalSearchParams<{ type?: CheckType }>();
  const checkType: CheckType = typeParam === 'check_out' ? 'check_out' : 'check_in';

  const { profile } = useAuthStore();
  const { state: locState, validate, reset: resetLoc } = useLocation();
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
  const { submit, submitStatus, reset: resetAttendance } = useAttendance();

  const [step, setStep] = useState<ScreenStep>('location');

  const title = checkType === 'check_out' ? 'Absen Keluar' : 'Absen Masuk';

  // Auto-validate GPS saat layar terbuka
  useEffect(() => {
    validate();
    return () => {
      resetLoc();
      resetFace();
      resetAttendance();
    };
  }, []);

  // Transisi step: lokasi valid → buka kamera
  useEffect(() => {
    if (locState.status === 'valid' && step === 'location') setStep('face');
    if (locState.status !== 'valid' && step === 'face') setStep('location');
  }, [locState.status, step]);

  // Buka kamera
  const handleOpenCamera = useCallback(async () => {
    const granted = await askPermission();
    if (!granted) {
      Alert.alert('Izin Kamera', 'Aktifkan izin kamera di Pengaturan untuk verifikasi wajah.');
    }
  }, [askPermission]);

  // Submit absensi setelah liveness challenge passed
  const handleSubmit = useCallback(async () => {
    if (!profile || !locState.nearestOffice || !faceDetState.capturedFrame) return;
    setStep('submitting');

    const result = await submit({
      type: checkType,
      locationState: locState,
      capturedFrame: faceDetState.capturedFrame,
      livenessOk: true,
    });

    if (result.status === 'success') {
      setStep('done');
    } else if (result.status === 'offline_queued') {
      setStep('offline_queued');
    } else {
      setStep('face');
      resetFace();
      Alert.alert('Absensi Gagal', result.error ?? 'Terjadi kesalahan. Coba lagi.');
    }
  }, [profile, locState, faceDetState.capturedFrame, checkType, submit, resetFace]);

  // ─── DONE ─────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-5 px-6">
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center">
          <Text className="text-5xl">✅</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900">
          {checkType === 'check_out' ? 'Absen Keluar Berhasil!' : 'Absen Masuk Berhasil!'}
        </Text>
        <Text className="text-base text-gray-500 text-center">
          {checkType === 'check_out'
            ? 'Absensi keluar Anda telah tercatat.'
            : `Absensi masuk Anda telah tercatat di\n`}
          {checkType === 'check_in' && (
            <Text className="font-semibold text-gray-700">
              {locState.nearestOffice?.name}
            </Text>
          )}
        </Text>
        <Button
          label="Selesai"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  // ─── OFFLINE QUEUED ────────────────────────────────────────────────────────
  if (step === 'offline_queued') {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-5 px-6">
        <View className="w-24 h-24 bg-yellow-100 rounded-full items-center justify-center">
          <Text className="text-5xl">📶</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900">Tersimpan Offline</Text>
        <Text className="text-base text-gray-500 text-center leading-6">
          Tidak ada koneksi internet. Absensi disimpan dan akan dikirim otomatis saat koneksi tersedia.
        </Text>
        <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 w-full">
          <Text className="text-sm text-yellow-700 text-center font-medium">
            ⚠️ Absensi menunggu sinkronisasi
          </Text>
        </View>
        <Button
          label="Kembali ke Beranda"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  // ─── SUBMITTING ───────────────────────────────────────────────────────────
  if (step === 'submitting') {
    const label =
      submitStatus === 'verifying_face'
        ? 'Memverifikasi wajah...'
        : 'Menyimpan absensi...';
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-4">
        <Text className="text-5xl">⏳</Text>
        <Text className="text-lg font-semibold text-gray-800">{label}</Text>
        <Text className="text-sm text-gray-500">Harap tunggu sebentar</Text>
      </SafeAreaView>
    );
  }

  // ─── FACE CAMERA ─────────────────────────────────────────────────────────
  if (step === 'face' && faceDetState.permission === 'granted') {
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
          onChallengePassed={markChallengePassed}
          onRetry={resetFace}
        />

        {faceDetState.challengeStatus === 'passed' && (
          <View className="absolute bottom-32 left-6 right-6">
            <Button
              label={`Konfirmasi ${title}`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSubmit}
            />
          </View>
        )}

        <SafeAreaView className="absolute top-0 left-0 right-0">
          <View className="px-4 pt-2">
            <Button
              label="Batal"
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
              className="self-start"
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── LOCATION + FACE GATE ─────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-8 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">{title}</Text>
          <Button label="Tutup" variant="ghost" size="sm" onPress={() => router.back()} />
        </View>

        {/* Step 1: Lokasi */}
        <Card>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">1. Validasi Lokasi</Text>
            <StepBadge current={step} step="location" />
          </View>
          <LocationStatus state={locState} />
          {(locState.status === 'invalid' || locState.status === 'error') && (
            <Button
              label="Coba Lagi"
              variant="outline"
              size="sm"
              onPress={validate}
              className="mt-3"
            />
          )}
        </Card>

        {/* Step 2: Verifikasi Wajah */}
        <Card>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">2. Verifikasi Wajah</Text>
            <StepBadge current={step} step="face" />
          </View>
          {locState.status === 'valid' ? (
            <View className="gap-3">
              <Text className="text-sm text-gray-500">
                Lokasi valid. Lanjutkan verifikasi wajah dengan kamera depan.
              </Text>
              <Button
                label="Buka Kamera"
                variant="primary"
                size="md"
                fullWidth
                onPress={handleOpenCamera}
              />
            </View>
          ) : (
            <View className="bg-gray-50 rounded-xl p-3">
              <Text className="text-sm text-gray-400 text-center">
                Validasi lokasi terlebih dahulu
              </Text>
            </View>
          )}
        </Card>

        <Text className="text-center text-xs text-gray-400 mt-2">
          Absensi tercatat dengan timestamp server secara otomatis
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
