import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { OfficesClient } from './OfficesClient';

export default async function OfficesPage() {
  const supabase = await createClient();
  const { data: offices } = await supabase
    .from('offices')
    .select('*')
    .order('name');

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Manajemen Kantor" description="Kelola lokasi dan radius absensi kantor" />
      <div className="flex-1 overflow-auto p-6">
        <OfficesClient initialData={offices ?? []} />
      </div>
    </div>
  );
}
