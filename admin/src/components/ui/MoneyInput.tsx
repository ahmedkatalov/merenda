import { forwardRef, useEffect, useState, type InputHTMLAttributes } from 'react';
import { minorToMajor, parseMoneyToMinor } from '@merenda/shared';
import { cn } from '@/lib/utils';
import { controlBase, controlInvalid } from './Input';

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  /** Minor units (kopecks). */
  value: number | null | undefined;
  onChange: (minor: number | null) => void;
  symbol?: string;
  invalid?: boolean;
  allowEmpty?: boolean;
  inputSize?: 'sm' | 'md';
}

function toDisplay(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return '';
  const major = minorToMajor(minor);
  return Number.isInteger(major) ? String(major) : major.toFixed(2);
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, symbol = '₽', invalid, className, allowEmpty = false, inputSize = 'md', onBlur, ...rest },
  ref,
) {
  const [text, setText] = useState(() => toDisplay(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(toDisplay(value));
  }, [value, focused]);

  return (
    <div className={cn('relative', className)}>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,-]/g, '');
          setText(raw);
          if (raw.trim() === '') {
            onChange(allowEmpty ? null : 0);
          } else {
            onChange(parseMoneyToMinor(raw));
          }
        }}
        onBlur={(e) => {
          setFocused(false);
          setText(toDisplay(value));
          onBlur?.(e);
        }}
        className={cn(controlBase, inputSize === 'sm' ? 'h-9' : 'h-10', 'px-3 pr-9 tabular-nums', invalid && controlInvalid)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">{symbol}</span>
    </div>
  );
});
