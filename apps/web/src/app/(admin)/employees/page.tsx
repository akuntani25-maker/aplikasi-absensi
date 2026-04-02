import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/layout/TopBar';
import { EmployeesClient } from './EmployeesClient';

export default async function EmployeesPage() {
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'employee')
    .order('full_name');

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Manajemen Karyawan" description="Kelola data dan status karyawan" />
      <div className="flex-1 overflow-auto p-6">
        <EmployeesClient initialData={employees ?? []} />
      </div>
    </div>
  );
}
