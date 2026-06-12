import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200'
  };

  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', tones[tone], className)} {...props} />;
}
