import { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';

import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { attendanceService } from '../../../services/attendanceService';
import { QUERY_KEYS } from '../../../lib/constants';

const PER_PAGE = 20;

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

const STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  present:  { label: 'Hadir',         variant: 'success' },
  late:     { label: 'Terlambat',     variant: 'warning' },
  absent:   { label: 'Tidak Hadir',   variant: 'danger'  },
  half_day: { label: 'Setengah Hari', variant: 'warning' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatHours(hours: number | null): string {
  if (!hours) return '–';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

type DailyRecord = Awaited<ReturnType<typeof attendanceService.getDailyHistory>>['data'][number];

function AttendanceCard({ item }: { item: DailyRecord }) {
  const badge = STATUS_BADGE[item.status] ?? { label: item.status, variant: 'neutral' as BadgeVariant };
  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-start mb-3">
        <Text className="text-sm font-semibold text-gray-800 flex-1 mr-2 capitalize">
          {formatDate(item.date)}
        </Text>
        <Badge label={badge.label} variant={badge.variant} />
      </View>
      <View className="flex-row gap-5">
        <View>
          <Text className="text-xs text-gray-400">Masuk</Text>
          <Text className="text-sm font-medium text-gray-700">{formatTime(item.check_in_time)}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-400">Keluar</Text>
          <Text className="text-sm font-medium text-gray-700">{formatTime(item.check_out_time)}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-400">Durasi</Text>
          <Text className="text-sm font-medium text-gray-700">{formatHours(item.total_hours)}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function HistoryScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.attendance,
    queryFn: ({ pageParam = 0 }) =>
      attendanceService.getDailyHistory({ page: pageParam as number, perPage: PER_PAGE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.length * PER_PAGE;
      return fetched < lastPage.total ? allPages.length : undefined;
    },
  });

  const allRecords = data?.pages.flatMap((p) => p.data) ?? [];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 pt-6">
        <Text className="text-2xl font-bold text-gray-900 mb-5 px-2">Riwayat Absensi</Text>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-400 mt-3 text-sm">Memuat data...</Text>
          </View>
        ) : (
          <FlashList
            data={allRecords}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AttendanceCard item={item} />}
            estimatedItemSize={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#2563eb"
              />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#2563eb" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center py-20 gap-3">
                <Text className="text-4xl">📋</Text>
                <Text className="text-gray-500 font-medium">Belum ada data absensi</Text>
                <Text className="text-gray-400 text-sm">Mulai absensi untuk melihat riwayat</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
