import { useRef, type KeyboardEvent, type ReactNode } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);
  const activeIndex = options.findIndex((o) => o.value === value);
  // The group is one tab stop; arrow keys move selection (ARIA radiogroup pattern).
  const focusIndex = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    onChange(opt.value);
    ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[index]?.focus();
  };
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = options.length - 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusIndex(index === last ? 0 : index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusIndex(index === 0 ? last : index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusIndex(last);
    }
  };
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={rest['aria-label']}
      className={cn('inline-flex shrink-0 items-stretch gap-0.5 rounded-[10px] bg-zinc-100 p-0.5', fullWidth && 'flex w-full', disabled && 'opacity-60', className)}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={disabled ? -1 : active || (activeIndex === -1 && i === 0) ? 0 : -1}
            title={o.title}
            disabled={disabled}
            onKeyDown={(e) => onKeyDown(e, i)}
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
