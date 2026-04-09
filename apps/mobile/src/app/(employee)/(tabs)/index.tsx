import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../../../stores/useAuthStore';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { OfflineBanner } from '../../../components/attendance/OfflineBanner';
import { attendanceService } from '../../../services/attendanceService';
import { QUERY_KEYS } from '../../../lib/constants';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  present:  { label: 'Hadir',         variant: 'success' },
  late:     { label: 'Terlambat',     variant: 'warning' },
  absent:   { label: 'Tidak Hadir',   variant: 'danger'  },
  half_day: { label: 'Setengah Hari', variant: 'warning' },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function formatTime(iso: string | null): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const now = useClock();
  const { pendingCount } = useOfflineSync();

  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Query status absensi hari ini
  const { data: todayRecord } = useQuery({
    queryKey: [...QUERY_KEYS.dailyAttendance, 'today'],
    queryFn: () => attendanceService.getMyDailyAttendance(),
    enabled: !!profile,
    refetchInterval: 60_000,
  });

  const statusInfo = todayRecord
    ? (STATUS_MAP[todayRecord.status] ?? { label: todayRecord.status, variant: 'neutral' as BadgeVariant })
    : { label: 'Belum Absen', variant: 'neutral' as BadgeVariant };

  const hasCheckedIn  = !!todayRecord?.check_in_time;
  const hasCheckedOut = !!todayRecord?.check_out_time;
  const isAllDone     = hasCheckedIn && hasCheckedOut;

  // Query ringkasan mingguan
  const { data: weeklySummary = [] } = useQuery({
    queryKey: [...QUERY_KEYS.weeklySummary],
    queryFn: () => attendanceService.getWeeklySummary(),
    enabled: !!profile,
    staleTime: 5 * 60_000,
  });

  // 5 hari kerja minggu ini (Sen–Jum)
  const weekDays = (() => {
    const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1));
    monday.setHours(0, 0, 0, 0);

    const byDate = new Map(weeklySummary.map((r) => [r.date as string, r.status as string | null]));

    return DAY_LABELS.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateKey = date.toISOString().substring(0, 10);
      return { label, status: byDate.get(dateKey) ?? null, isFuture: date > today };
    });
  })();

  // Tombol absensi: teks + warna berdasarkan state
  const checkInLabel = isAllDone
    ? 'Sudah Absen Hari Ini'
    : hasCheckedIn
    ? 'Absen Keluar'
    : 'Absen Masuk';

  const checkInBg = isAllDone
    ? 'bg-gray-300'
    : hasCheckedIn
    ? 'bg-orange-500 active:bg-orange-600'
    : 'bg-blue-600 active:bg-blue-700';

  const checkInSubLabel = isAllDone
    ? null
    : hasCheckedIn
    ? 'Tap untuk mencatat jam keluar'
    : 'Tap untuk memulai absensi';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Offline pending banner */}
      <OfflineBanner pendingCount={pendingCount} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6 gap-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <Text className="text-lg text-gray-500">{getGreeting()},</Text>
          <Text className="text-2xl font-bold text-gray-900">
            {profile?.full_name ?? 'Karyawan'}
          </Text>
          <Text className="text-sm text-gray-400 mt-1">{profile?.employee_id}</Text>
        </View>

        {/* Jam & Tanggal */}
        <Card className="items-center py-6">
          <Text className="text-5xl font-bold text-blue-600 tracking-tight">{timeStr}</Text>
          <Text className="text-sm text-gray-500 mt-2 capitalize">{dateStr}</Text>
        </Card>

        {/* Status Hari Ini */}
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-3">Status Hari Ini</Text>
          <View className="flex-row justify-between items-center">
            <View className="items-center gap-1">
              <Text className="text-xs text-gray-500">Masuk</Text>
              <Text className="text-sm font-semibold text-gray-800">
                {formatTime(todayRecord?.check_in_time ?? null)}
              </Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-xs text-gray-500">Keluar</Text>
              <Text className="text-sm font-semibold text-gray-800">
                {formatTime(todayRecord?.check_out_time ?? null)}
              </Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-xs text-gray-500">Status</Text>
              <Badge label={statusInfo.label} variant={statusInfo.variant} />
            </View>
          </View>
        </Card>

        {/* Tombol Absensi */}
        <TouchableOpacity
          onPress={() => {
            if (isAllDone) return;
            const type = hasCheckedIn ? 'check_out' : 'check_in';
            router.push(`/(employee)/check-in?type=${type}`);
          }}
          disabled={isAllDone}
          className={`rounded-2xl p-5 items-center ${checkInBg}`}
        >
          <Text className="text-white text-xl font-bold">{checkInLabel}</Text>
          {checkInSubLabel && (
            <Text className={`text-sm mt-1 ${hasCheckedIn ? 'text-orange-200' : 'text-blue-200'}`}>
              {checkInSubLabel}
            </Text>
          )}
        </TouchableOpacity>

        {/* Absensi Minggu Ini */}
        <Card>
          <Text className="text-base font-semibold text-gray-800 mb-3">Absensi Minggu Ini</Text>
          <View className="flex-row justify-between">
            {weekDays.map(({ label, status, isFuture }) => {
              const dot = isFuture
                ? { bg: 'bg-gray-100', text: 'text-gray-400', symbol: '–' }
                : status === 'present'
                ? { bg: 'bg-green-100',  text: 'text-green-600',  symbol: '✓' }
                : status === 'late'
                ? { bg: 'bg-yellow-100', text: 'text-yellow-600', symbol: '!' }
                : status === 'absent'
                ? { bg: 'bg-red-100',    text: 'text-red-500',    symbol: '✗' }
                : status === 'half_day'
                ? { bg: 'bg-orange-100', text: 'text-orange-500', symbol: '½' }
                : { bg: 'bg-gray-100',   text: 'text-gray-400',   symbol: '–' };
              return (
                <View key={label} className="items-center gap-2">
                  <Text className="text-xs text-gray-400">{label}</Text>
                  <View className={`w-8 h-8 rounded-full ${dot.bg} items-center justify-center`}>
                    <Text className={`text-xs font-semibold ${dot.text}`}>{dot.symbol}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View className="flex-row gap-4 mt-3 flex-wrap">
            {[
              { color: 'bg-green-400',  label: 'Hadir' },
              { color: 'bg-yellow-400', label: 'Terlambat' },
              { color: 'bg-red-400',    label: 'Absen' },
            ].map(({ color, label }) => (
              <View key={label} className="flex-row items-center gap-1">
                <View className={`w-3 h-3 rounded-full ${color}`} />
                <Text className="text-xs text-gray-500">{label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
