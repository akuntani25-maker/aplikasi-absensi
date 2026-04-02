'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils';
import { Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface FeedItem {
  id: string;
  employee_name: string;
  employee_id: string;
  type: 'check_in' | 'check_out';
  timestamp: string;
  status: string;
}

const AVATAR_COLORS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
  'from-purple-500 to-violet-600',
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] ?? 'from-indigo-500 to-violet-600';
}

export function RealtimeAttendanceFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toISOString().substring(0, 10);

    async function loadInitial() {
      const { data } = await supabase
        .from('attendance_records')
        .select('id, type, status, timestamp, employee_id, profiles!inner(full_name, employee_id)')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (data) {
        setFeed(
          data.map((r) => {
            const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            return {
              id: r.id,
              employee_name: (profile as { full_name: string } | null)?.full_name ?? 'Unknown',
              employee_id: (profile as { employee_id: string } | null)?.employee_id ?? r.employee_id,
              type: r.type as 'check_in' | 'check_out',
              timestamp: r.timestamp,
              status: r.status,
            };
          }),
        );
      }
    }

    loadInitial();

    const channel = supabase
      .channel('attendance-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records' },
        async (payload) => {
          const record = payload.new as {
            id: string; employee_id: string; type: string; status: string; timestamp: string;
          };
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, employee_id')
            .eq('id', record.employee_id)
            .single();

          setFeed((prev) => [
            {
              id: record.id,
              employee_name: profile?.full_name ?? 'Unknown',
              employee_id: profile?.employee_id ?? record.employee_id,
              type: record.type as 'check_in' | 'check_out',
              timestamp: record.timestamp,
              status: record.status,
            },
            ...prev.slice(0, 19),
          ]);
        },
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Live Absensi</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Aktivitas hari ini secara real-time</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
          />
          <span className="text-xs font-medium text-slate-500">
            {connected ? 'Live' : 'Menghubungkan...'}
          </span>
        </div>
      </div>

      {/* Feed */}
      {feed.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-300">
          <Activity className="w-10 h-10 mb-3" />
          <p className="text-sm font-medium text-slate-400">Belum ada aktivitas</p>
          <p className="text-xs text-slate-300 mt-1">Absensi akan muncul di sini secara real-time</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto -mx-1 px-1">
          {feed.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(item.employee_name)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <span className="text-xs font-bold text-white">
                    {item.employee_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.employee_name}</p>
                  <p className="text-xs text-slate-400 font-mono">{item.employee_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {item.type === 'check_in' ? (
                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded-lg px-2 py-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="text-xs font-medium">Masuk</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-slate-100 text-slate-600 rounded-lg px-2 py-1">
                    <ArrowDownLeft className="w-3 h-3" />
                    <span className="text-xs font-medium">Keluar</span>
                  </div>
                )}
                <span className="text-xs text-slate-400 font-mono w-10 text-right">
                  {formatTime(item.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
