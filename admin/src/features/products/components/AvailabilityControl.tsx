import { useRef, type KeyboardEvent } from 'react';
import { Check, EyeOff, X } from 'lucide-react';
import type { Availability } from '@merenda/shared';
import { AVAILABILITY_DESC, AVAILABILITY_LABELS, AVAILABILITY_SHORT } from '@/lib/i18n';
import { SegmentedControl } from '@/components/ui';
import { cn } from '@/lib/utils';

const OPTIONS: { value: Availability; icon: typeof Check; tone: 'success' | 'warning' | 'neutral' }[] = [
  { value: 'available', icon: Check, tone: 'success' },
  { value: 'unavailable', icon: X, tone: 'warning' },
  { value: 'hidden', icon: EyeOff, tone: 'neutral' },
];

const SELECTED: Record<'success' | 'warning' | 'neutral', { row: string; icon: string }> = {
  success: { row: 'border-emerald-500 bg-emerald-50', icon: 'bg-emerald-600 text-white' },
  warning: { row: 'border-amber-500 bg-amber-50', icon: 'bg-amber-500 text-white' },
  neutral: { row: 'border-zinc-400 bg-zinc-50', icon: 'bg-zinc-700 text-white' },
};

interface Props {
  value: Availability;
  onChange: (v: Availability) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  disabled?: boolean;
  compact?: boolean;
  /** 'segmented' (default) for dense rows/toolbars; 'stack' for a vertical list with descriptions. */
  layout?: 'segmented' | 'stack';
}

export function AvailabilityControl({ value, onChange, size = 'sm', fullWidth, disabled, compact, layout = 'segmented' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  if (layout === 'stack') {
    const move = (index: number) => {
      const opt = OPTIONS[index];
      if (!opt) return;
      onChange(opt.value);
      ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[index]?.focus();
    };
    const onKeyDown = (e: KeyboardEvent, index: number) => {
      const last = OPTIONS.length - 1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); move(index === last ? 0 : index + 1); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); move(index === 0 ? last : index - 1); }
      else if (e.key === 'Home') { e.preventDefault(); move(0); }
      else if (e.key === 'End') { e.preventDefault(); move(last); }
    };
    return (
      <div ref={ref} role="radiogroup" aria-label="Наличие" className="flex flex-col gap-2">
        {OPTIONS.map((o, i) => {
          const active = o.value === value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={disabled ? -1 : active ? 0 : -1}
              disabled={disabled}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => onChange(o.value)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors focus-ring',
                active ? SELECTED[o.tone].row : 'border-zinc-200 bg-white hover:border-zinc-300',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors', active ? SELECTED[o.tone].icon : 'bg-zinc-100 text-zinc-500')}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-zinc-900">{AVAILABILITY_LABELS[o.value]}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-zinc-500">{AVAILABILITY_DESC[o.value]}</span>
              </span>
              <span className={cn('ml-auto flex size-4 shrink-0 items-center justify-center rounded-full border', active ? 'border-transparent bg-zinc-900 text-white' : 'border-zinc-300')}>
                {active && <Check className="size-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const labels = compact ? AVAILABILITY_SHORT : AVAILABILITY_LABELS;
  return (
    <SegmentedControl<Availability>
      aria-label="Наличие"
      value={value}
      onChange={onChange}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      options={[
        { value: 'available', label: labels.available, icon: <Check />, tone: 'success', title: AVAILABILITY_LABELS.available },
        { value: 'unavailable', label: labels.unavailable, icon: <X />, tone: 'warning', title: AVAILABILITY_LABELS.unavailable },
        { value: 'hidden', label: labels.hidden, icon: <EyeOff />, tone: 'neutral', title: AVAILABILITY_LABELS.hidden },
      ]}
    />
  );
}
