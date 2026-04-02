import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { AttendanceClient } from './AttendanceClient';

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const targetDate = date ?? new Date().toISOString().substring(0, 10);

  const supabase = await createClient();
  const { data: records } = await supabase
    .from('daily_attendance')
    .select('*, profiles!employee_id(full_name, employee_id, department)')
    .eq('date', targetDate)
    .order('check_in_time', { ascending: true, nullsFirst: false });

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Rekap Absensi" description="Data kehadiran karyawan per hari" />
      <div className="flex-1 overflow-auto p-6">
        <AttendanceClient initialData={records ?? []} initialDate={targetDate} />
      </div>
    </div>
  );
}
