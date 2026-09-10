import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { controlBase, controlInvalid } from './Input';

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  unit?: string;
  invalid?: boolean;
  allowEmpty?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, onChange, unit, invalid, className, allowEmpty = true, ...rest },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        value={value === null || value === undefined || Number.isNaN(value) ? '' : value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(allowEmpty ? null : 0);
            return;
          }
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : null);
        }}
        className={cn(controlBase, 'h-10 px-3 tabular-nums', unit && 'pr-12', invalid && controlInvalid)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">{unit}</span>}
    </div>
  );
});
