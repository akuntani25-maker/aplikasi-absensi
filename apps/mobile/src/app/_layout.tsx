import '../../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    environment: __DEV__ ? 'development' : 'production',
    // Disable expo-updates integration — expo-updates is not installed
    // and this integration crashes with "Requiring unknown module" if absent
    integrations: (integrations) =>
      integrations.filter((i) => i.name !== 'ExpoUpdates'),
  });
}

import { useAuthStore } from '../stores/useAuthStore';
import { useAuthInit } from '../hooks/useAuth';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { ErrorBoundary } from '../components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 menit
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate() {
  const { session, profile, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useAuthInit();
  useOfflineSync(); // sync antrian offline saat koneksi tersedia

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      // Belum login → arahkan ke halaman login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (profile && !profile.face_enrolled) {
      // Sudah login tapi belum mendaftarkan wajah
      router.replace('/(employee)/face-enrollment');
    } else if (session && inAuthGroup) {
      // Sudah login dan wajah sudah terdaftar
      router.replace('/');
    }
  }, [session, profile, isInitialized, segments]);

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(employee)" />
    </Stack>
  );
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthGate />
            <StatusBar style="auto" />
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default SENTRY_DSN ? Sentry.wrap(RootLayout) : RootLayout;
