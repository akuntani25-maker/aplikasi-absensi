'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, STATUS_BADGE } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTime, formatHours } from '@/lib/utils';
import { Download, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DailyAttendanceWithProfile } from '@/types/database';

interface AttendanceClientProps {
  initialData: DailyAttendanceWithProfile[];
  initialDate: string;
}

export function AttendanceClient({ initialData, initialDate }: AttendanceClientProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);

  function handleDateChange(newDate: string) {
    setDate(newDate);
    router.push(`/attendance?date=${newDate}`);
  }

  function stepDate(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    handleDateChange(d.toISOString().substring(0, 10));
  }

  function exportCSV() {
    const headers = ['ID Karyawan', 'Nama', 'Departemen', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status', 'Total Jam'];
    const rows = initialData.map((r) => [
      r.profiles?.employee_id ?? '',
      r.profiles?.full_name ?? '',
      r.profiles?.department ?? '',
      r.date,
      r.check_in_time  ? new Date(r.check_in_time ).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      r.status,
      r.total_hours?.toFixed(2) ?? '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `absensi-${date}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const presentCount = initialData.filter((r) => r.status === 'present').length;
  const lateCount    = initialData.filter((r) => r.status === 'late').length;
  const absentCount  = initialData.filter((r) => r.status === 'absent').length;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => stepDate(-1)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="relative flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-sm text-slate-700 font-medium focus:outline-none bg-transparent cursor-pointer"
            />
          </div>
          <button
            onClick={() => stepDate(1)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Summary pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{presentCount} hadir
            </span>
            <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{lateCount} terlambat
            </span>
            <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full px-3 py-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />{absentCount} absen
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Karyawan</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Departemen</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Masuk</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Keluar</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Durasi</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Tidak ada data absensi untuk tanggal ini</p>
                  </td>
                </tr>
              ) : (
                initialData.map((record, idx) => {
                  const badge = STATUS_BADGE[record.status] ?? { label: record.status, variant: 'neutral' as const };
                  return (
                    <tr
                      key={record.id}
                      className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${idx === initialData.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{record.profiles?.full_name ?? '–'}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{record.profiles?.employee_id}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-sm">{record.profiles?.department ?? '–'}</td>
                      <td className="px-5 py-3.5 text-center font-mono text-slate-700 text-sm">{formatTime(record.check_in_time)}</td>
                      <td className="px-5 py-3.5 text-center font-mono text-slate-700 text-sm">{formatTime(record.check_out_time)}</td>
                      <td className="px-5 py-3.5 text-center text-slate-500 text-sm">{formatHours(record.total_hours)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <Badge label={badge.label} variant={badge.variant} dot />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
