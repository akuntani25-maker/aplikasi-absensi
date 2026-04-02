'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, MapPin, Plus, X, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Office } from '@/types/database';

interface OfficesClientProps {
  initialData: Office[];
}

interface OfficeFormState {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
}

const EMPTY_FORM: OfficeFormState = {
  name: '', address: '', latitude: '', longitude: '', radius_meters: '100',
};

export function OfficesClient({ initialData }: OfficesClientProps) {
  const [offices, setOffices] = useState<Office[]>(initialData);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<OfficeFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditId(null); setForm(EMPTY_FORM); setError(null); setShowModal(true);
  }

  function openEdit(office: Office) {
    setEditId(office.id);
    setForm({ name: office.name, address: office.address ?? '', latitude: String(office.latitude), longitude: String(office.longitude), radius_meters: String(office.radius_meters) });
    setError(null); setShowModal(true);
  }

  async function handleSave() {
    setError(null);
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const radius = parseInt(form.radius_meters, 10);

    if (!form.name.trim())          { setError('Nama kantor wajib diisi.'); return; }
    if (isNaN(lat) || isNaN(lng))   { setError('Koordinat tidak valid.'); return; }
    if (isNaN(radius) || radius < 50) { setError('Radius minimal 50 meter.'); return; }

    setSaving(true);
    const supabase = createClient();
    const payload = { name: form.name.trim(), address: form.address.trim() || null, latitude: lat, longitude: lng, radius_meters: radius };

    if (editId) {
      const { data, error: err } = await supabase.from('offices').update(payload).eq('id', editId).select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      setOffices((prev) => prev.map((o) => (o.id === editId ? (data as Office) : o)));
    } else {
      const { data, error: err } = await supabase.from('offices').insert({ ...payload, is_active: true }).select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      setOffices((prev) => [...prev, data as Office]);
    }

    setSaving(false);
    setShowModal(false);
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from('offices').update({ is_active: !current }).eq('id', id);
    if (!error) setOffices((prev) => prev.map((o) => (o.id === id ? { ...o, is_active: !current } : o)));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{offices.length} kantor terdaftar</p>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" />
          Tambah Kantor
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Nama Kantor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Alamat</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Koordinat</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Radius</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {offices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-300">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-slate-400 font-medium">Belum ada kantor terdaftar</p>
                    <p className="text-xs text-slate-300 mt-1">Klik tombol Tambah Kantor untuk memulai</p>
                  </td>
                </tr>
              ) : (
                offices.map((office, idx) => (
                  <tr key={office.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${idx === offices.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="font-medium text-slate-900">{office.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate">{office.address ?? '–'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 bg-slate-50 rounded-lg px-2 py-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {office.latitude.toFixed(5)}, {office.longitude.toFixed(5)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                        {office.radius_meters}
                        <span className="text-xs font-normal text-slate-400">m</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge label={office.is_active ? 'Aktif' : 'Nonaktif'} variant={office.is_active ? 'success' : 'neutral'} dot />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(office)}>
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={office.is_active ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-600' : 'text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => toggleActive(office.id, office.is_active)}
                        >
                          {office.is_active ? (
                            <><ToggleLeft className="w-3.5 h-3.5" />Nonaktifkan</>
                          ) : (
                            <><ToggleRight className="w-3.5 h-3.5" />Aktifkan</>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editId ? 'Edit Kantor' : 'Tambah Kantor Baru'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editId ? 'Perbarui informasi kantor' : 'Daftarkan lokasi kantor baru'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1" />
                  {error}
                </div>
              )}
              <Input label="Nama Kantor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kantor Pusat Jakarta" />
              <Input label="Alamat (opsional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Jl. Sudirman No. 1, Jakarta" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-6.2088" type="number" step="any" />
                <Input label="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="106.8456" type="number" step="any" />
              </div>
              <Input label="Radius (meter)" value={form.radius_meters} onChange={(e) => setForm({ ...form, radius_meters: e.target.value })} placeholder="100" type="number" min="50" />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button loading={saving} onClick={handleSave}>
                {editId ? 'Simpan Perubahan' : 'Tambah Kantor'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
