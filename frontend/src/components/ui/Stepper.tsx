import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  size?: 'sm' | 'md';
  /** Show a trash icon instead of minus when at min. */
  removable?: boolean;
  className?: string;
}

export function Stepper({ value, min = 1, max = 99, onChange, size = 'md', removable, className }: Props) {
  const btn = cn(
    'inline-flex items-center justify-center rounded-[calc(var(--radius-button)-2px)] text-heading transition-colors hover:bg-surface-alt active:bg-border disabled:opacity-40',
    size === 'md' ? 'size-10' : 'size-8',
  );
  const atMin = value <= min;
  return (
    <div
      className={cn('inline-flex items-center rounded-button border border-border bg-surface-solid p-0.5', className)}
      role="group"
      aria-label={t.menu.quantity}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={atMin && !removable} aria-label={t.a11y.decrease}>
        {atMin && removable ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
      </button>
      <span className={cn('min-w-8 text-center font-semibold tabular-nums', size === 'sm' && 'text-[0.9375rem]')} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t.a11y.increase}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}
