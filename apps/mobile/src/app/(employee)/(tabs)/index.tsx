import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../../../stores/useAuthStore';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { attendanceService } from '../../../services/attendanceService';
import { QUERY_KEYS } from '../../../lib/constants';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  present: { label: 'Hadir', variant: 'success' },
  late:    { label: 'Terlambat', variant: 'warning' },
  absent:  { label: 'Tidak Hadir', variant: 'danger' },
  half_day:{ label: 'Setengah Hari', variant: 'warning' },
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
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Jam yang di-refresh setiap menit
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

  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Query status absensi hari ini
  const { data: todayRecord } = useQuery({
    queryKey: [...QUERY_KEYS.dailyAttendance, 'today'],
    queryFn: () => attendanceService.getMyDailyAttendance(),
    enabled: !!profile,
    refetchInterval: 60_000, // refresh tiap menit
  });

  const statusInfo = todayRecord
    ? (STATUS_MAP[todayRecord.status] ?? { label: todayRecord.status, variant: 'neutral' as BadgeVariant })
    : { label: 'Belum Absen', variant: 'neutral' as BadgeVariant };

  const hasCheckedIn = !!todayRecord?.check_in_time;
  const hasCheckedOut = !!todayRecord?.check_out_time;

  // Query ringkasan mingguan
  const { data: weeklySummary = [] } = useQuery({
    queryKey: [...QUERY_KEYS.weeklySummary],
    queryFn: () => attendanceService.getWeeklySummary(),
    enabled: !!profile,
    staleTime: 5 * 60_000,
  });

  // Bangun array 5 hari kerja (Sen–Jum minggu ini)
  const weekDays = (() => {
    const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1));
    monday.setHours(0, 0, 0, 0);

    // Index summary by date string
    const byDate = new Map(weeklySummary.map((r) => [r.date as string, r.status as string | null]));

    return DAY_LABELS.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().substring(0, 10);
      const isPastOrToday = date <= today;
      return {
        label,
        status: byDate.get(dateStr) ?? null,
        isFuture: !isPastOrToday,
      };
    });
  })();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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

        {/* Tombol Absen */}
        <TouchableOpacity
          onPress={() => {
            router.push('/(employee)/check-in');
          }}
          disabled={hasCheckedIn && hasCheckedOut}
          className={`rounded-2xl p-5 items-center ${
            hasCheckedIn && hasCheckedOut
              ? 'bg-gray-300'
              : hasCheckedIn
              ? 'bg-orange-500 active:bg-orange-600'
              : 'bg-blue-600 active:bg-blue-700'
          }`}
        >
          <Text className="text-white text-xl font-bold">
            {hasCheckedIn && hasCheckedOut
              ? 'Sudah Absen Hari Ini'
              : hasCheckedIn
              ? 'Absen Keluar'
              : 'Absen Masuk'}
          </Text>
          {!(hasCheckedIn && hasCheckedOut) && (
            <Text className={`text-sm mt-1 ${hasCheckedIn ? 'text-orange-200' : 'text-blue-200'}`}>
              Tap untuk memulai absensi
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
                ? { bg: 'bg-green-100', text: 'text-green-600', symbol: '✓' }
                : status === 'late'
                ? { bg: 'bg-yellow-100', text: 'text-yellow-600', symbol: '!' }
                : status === 'absent'
                ? { bg: 'bg-red-100', text: 'text-red-500', symbol: '✗' }
                : status === 'half_day'
                ? { bg: 'bg-orange-100', text: 'text-orange-500', symbol: '½' }
                : { bg: 'bg-gray-100', text: 'text-gray-400', symbol: '–' };
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
          {/* Legend */}
          <View className="flex-row gap-4 mt-3 flex-wrap">
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-green-400" />
              <Text className="text-xs text-gray-500">Hadir</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-yellow-400" />
              <Text className="text-xs text-gray-500">Terlambat</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-red-400" />
              <Text className="text-xs text-gray-500">Absen</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
