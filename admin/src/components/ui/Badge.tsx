import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'dark';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200/70',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200/70',
  danger: 'bg-red-50 text-red-700 ring-red-200/70',
  info: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  accent: 'bg-brand-50 text-brand-700 ring-brand-200/70',
  dark: 'bg-zinc-900 text-white ring-zinc-900',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Badge({ tone = 'neutral', size = 'md', icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-xs',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {icon && <span className="inline-flex [&>svg]:size-3">{icon}</span>}
      {children}
    </span>
  );
}
