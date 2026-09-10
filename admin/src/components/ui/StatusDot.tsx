import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const colors: Record<StatusTone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-zinc-400',
  info: 'bg-sky-500',
};

export function StatusDot({ tone = 'neutral', pulse, className }: { tone?: StatusTone; pulse?: boolean; className?: string }) {
  return (
    <span className={cn('relative inline-flex size-2 shrink-0', className)}>
      {pulse && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', colors[tone])} />}
      <span className={cn('relative inline-flex size-2 rounded-full', colors[tone])} />
    </span>
  );
}
