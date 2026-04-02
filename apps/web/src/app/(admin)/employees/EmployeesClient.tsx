'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCheck, UserX, Users } from 'lucide-react';
import type { Profile } from '@/types/database';

const AVATAR_COLORS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] ?? 'from-indigo-500 to-violet-600';
}

interface EmployeesClientProps {
  initialData: Profile[];
}

export function EmployeesClient({ initialData }: EmployeesClientProps) {
  const [employees, setEmployees] = useState<Profile[]>(initialData);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      (e.department ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ is_active: !current }).eq('id', id);
    if (!error) {
      startTransition(() => {
        setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, is_active: !current } : e)));
      });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
        <Input
          placeholder="Cari nama, ID, departemen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2 text-sm text-slate-400 shrink-0">
          <Users className="w-4 h-4" />
          <span>{filtered.length} karyawan</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Karyawan</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Departemen</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Jabatan</th>
              <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Face ID</th>
              <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Tidak ada karyawan ditemukan</p>
                </td>
              </tr>
            ) : (
              filtered.map((emp, idx) => (
                <tr
                  key={emp.id}
                  className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${idx === filtered.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(emp.full_name)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <span className="text-xs font-bold text-white">
                          {emp.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{emp.full_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{emp.employee_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{emp.department ?? '–'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{emp.position ?? '–'}</td>
                  <td className="px-5 py-3.5 text-center">
                    {emp.face_enrolled ? (
                      <Badge label="Terdaftar" variant="success" dot />
                    ) : (
                      <Badge label="Belum" variant="neutral" />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {emp.is_active ? (
                      <Badge label="Aktif" variant="success" dot />
                    ) : (
                      <Badge label="Nonaktif" variant="danger" dot />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      variant={emp.is_active ? 'ghost' : 'secondary'}
                      size="sm"
                      onClick={() => toggleActive(emp.id, emp.is_active)}
                      className={emp.is_active ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-600' : ''}
                    >
                      {emp.is_active ? (
                        <><UserX className="w-3.5 h-3.5" />Nonaktifkan</>
                      ) : (
                        <><UserCheck className="w-3.5 h-3.5" />Aktifkan</>
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
