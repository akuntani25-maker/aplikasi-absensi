import { createClient } from '@/lib/supabase/server';
import { Bell } from 'lucide-react';

interface TopBarProps {
  title: string;
  description?: string;
}

export async function TopBar({ title, description }: TopBarProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let adminName = 'Admin';
  let adminInitial = 'A';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    if (profile?.full_name) {
      adminName = profile.full_name;
      adminInitial = profile.full_name.charAt(0).toUpperCase();
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-base font-semibold text-slate-900 leading-none">{title}</h1>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
          <Bell className="w-4.5 h-4.5 text-slate-400" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-500/20 flex-shrink-0">
            <span className="text-xs font-bold text-white">{adminInitial}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{adminName}</p>
            <p className="text-xs text-slate-400 mt-0.5">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
