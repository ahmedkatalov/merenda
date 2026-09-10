import { useId, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  unit?: string;
  format?: (v: number) => string;
  disabled?: boolean;
  className?: string;
}

export function Slider({ value, onChange, min, max, step = 1, label, unit, format, disabled, className }: SliderProps) {
  const id = useId();
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const display = format ? format(value) : `${value}${unit ?? ''}`;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-[13px] font-medium text-zinc-700">
            {label}
          </label>
          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[12px] font-medium tabular-nums text-zinc-700">{display}</span>
        </div>
      )}
      <input
        id={id}
        type="range"
        className="ui-range"
        style={{ '--fill': `${pct}%` } as CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
      />
    </div>
  );
}
