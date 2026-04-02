import { cn } from '@/lib/utils';

const VARIANTS = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger:  'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
  info:    'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
} as const;

const DOTS = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-rose-500',
  info:    'bg-indigo-500',
  neutral: 'bg-slate-400',
} as const;

type BadgeVariant = keyof typeof VARIANTS;

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function Badge({ label, variant = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', DOTS[variant])} />}
      {label}
    </span>
  );
}

export const STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  present:          { label: 'Hadir',         variant: 'success' },
  late:             { label: 'Terlambat',     variant: 'warning' },
  absent:           { label: 'Tidak Hadir',   variant: 'danger'  },
  half_day:         { label: 'Setengah Hari', variant: 'warning' },
  valid:            { label: 'Valid',         variant: 'success' },
  pending:          { label: 'Pending',       variant: 'neutral' },
  invalid_location: { label: 'Lokasi Invalid', variant: 'danger' },
  invalid_face:     { label: 'Wajah Invalid',  variant: 'danger' },
};
