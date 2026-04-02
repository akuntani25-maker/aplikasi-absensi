import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red';
  description?: string;
  trend?: string;
}

const COLOR_MAP = {
  blue:   {
    gradient: 'from-indigo-500 to-blue-600',
    shadow:   'shadow-indigo-500/20',
    value:    'text-indigo-700',
    bg:       'bg-indigo-50',
  },
  green:  {
    gradient: 'from-emerald-500 to-teal-600',
    shadow:   'shadow-emerald-500/20',
    value:    'text-emerald-700',
    bg:       'bg-emerald-50',
  },
  yellow: {
    gradient: 'from-amber-500 to-orange-500',
    shadow:   'shadow-amber-500/20',
    value:    'text-amber-700',
    bg:       'bg-amber-50',
  },
  red:    {
    gradient: 'from-rose-500 to-pink-600',
    shadow:   'shadow-rose-500/20',
    value:    'text-rose-700',
    bg:       'bg-rose-50',
  },
};

export function StatsCard({ label, value, icon: Icon, color, description }: StatsCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex items-center gap-4">
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br',
        c.gradient,
        c.shadow,
      )}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide truncate">{label}</p>
        <p className={cn('text-3xl font-bold mt-0.5 leading-none', c.value)}>
          {value.toLocaleString('id-ID')}
        </p>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
