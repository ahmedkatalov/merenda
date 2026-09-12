import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'accent' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'muted';

const TONE: Record<Tone, string> = {
  accent: 'bg-accent text-on-accent',
  primary: 'bg-primary text-on-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-alt text-heading',
  muted: 'bg-surface-alt text-muted',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: 'xs' | 'sm';
  children: ReactNode;
}

export function Badge({ tone = 'neutral', size = 'sm', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold leading-none tracking-wide',
        size === 'xs' ? 'px-2 py-1 text-[0.6875rem]' : 'px-2.5 py-1.5 text-[0.75rem]',
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
