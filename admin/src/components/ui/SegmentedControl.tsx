import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentOption<V extends string> {
  value: V;
  label: ReactNode;
  icon?: ReactNode;
  tone?: 'success' | 'warning' | 'neutral' | 'danger';
  title?: string;
}

export interface SegmentedControlProps<V extends string> {
  options: SegmentOption<V>[];
  value: V;
  onChange: (value: V) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const activeTone = {
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-600 text-white',
  neutral: 'bg-zinc-700 text-white',
};

export function SegmentedControl<V extends string>({ options, value, onChange, size = 'md', fullWidth, disabled, className, ...rest }: SegmentedControlProps<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={rest['aria-label']}
      className={cn('inline-flex shrink-0 items-stretch gap-0.5 rounded-[10px] bg-zinc-100 p-0.5', fullWidth && 'flex w-full', disabled && 'opacity-60', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onChange(o.value);
            }}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] font-medium transition-all focus-ring',
              size === 'sm' ? 'h-8 px-2.5 text-[12.5px]' : 'h-9 px-3 text-[13px]',
              fullWidth && 'flex-1',
              active ? (o.tone ? activeTone[o.tone] : 'bg-white text-zinc-900 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.04)]') : 'text-zinc-600 hover:text-zinc-900',
            )}
          >
            {o.icon && <span className="inline-flex [&>svg]:size-4">{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
