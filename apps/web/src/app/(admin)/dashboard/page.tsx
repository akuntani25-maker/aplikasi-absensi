import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RealtimeAttendanceFeed } from '@/components/dashboard/RealtimeAttendanceFeed';
import { WeeklyChart } from '@/components/dashboard/WeeklyChart';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';

async function getDashboardStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().substring(0, 10);

  const [
    { count: totalEmployees },
    { count: presentToday },
    { count: lateToday },
    { count: absentToday },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employee').eq('is_active', true),
    supabase.from('daily_attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
    supabase.from('daily_attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'late'),
    supabase.from('daily_attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'absent'),
  ]);

  return {
    totalEmployees: totalEmployees ?? 0,
    presentToday:   presentToday  ?? 0,
    lateToday:      lateToday     ?? 0,
    absentToday:    absentToday   ?? 0,
  };
}

async function getWeeklyChartData() {
  const supabase = await createClient();

  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1));
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const { data } = await supabase
    .from('daily_attendance')
    .select('date, status')
    .gte('date', monday.toISOString().substring(0, 10))
    .lte('date', friday.toISOString().substring(0, 10));

  const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
  return DAY_LABELS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().substring(0, 10);
    const dayRecords = (data ?? []).filter((r) => r.date === dateStr);
    return {
      day,
      Hadir:         dayRecords.filter((r) => r.status === 'present').length,
      Terlambat:     dayRecords.filter((r) => r.status === 'late').length,
      'Tidak Hadir': dayRecords.filter((r) => r.status === 'absent').length,
    };
  });
}

export default async function DashboardPage() {
  const [stats, weeklyData] = await Promise.all([getDashboardStats(), getWeeklyChartData()]);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Dashboard" description={today} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard label="Total Karyawan" value={stats.totalEmployees} icon={Users}     color="blue"   description="Karyawan aktif"  />
          <StatsCard label="Hadir Hari Ini" value={stats.presentToday}  icon={UserCheck} color="green"  description="Tepat waktu"      />
          <StatsCard label="Terlambat"      value={stats.lateToday}     icon={Clock}     color="yellow" description="Hari ini"          />
          <StatsCard label="Tidak Hadir"    value={stats.absentToday}   icon={UserX}     color="red"    description="Hari ini"          />
        </div>

        {/* Charts & Feed */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <WeeklyChart data={weeklyData} />
          <RealtimeAttendanceFeed />
        </div>
      </div>
    </div>
  );
}
