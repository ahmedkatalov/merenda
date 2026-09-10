import { useEffect, useState } from 'react';
import { cn, isHexColor } from '@/lib/utils';
import { controlBase } from './Input';

export interface ColorFieldProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

function expand(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length === 3) return '#' + c.split('').map((x) => x + x).join('');
  return '#' + c;
}

export function ColorField({ value, onChange, label, className, disabled }: ColorFieldProps) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const valid = isHexColor(text);
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label className={cn('relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-[10px] border border-zinc-200 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.6)]', disabled && 'cursor-not-allowed opacity-60')} style={{ backgroundColor: valid ? expand(text) : value }} title="Выбрать цвет">
        <input type="color" value={valid ? expand(text) : expand(value)} disabled={disabled} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={label ? `${label}: выбрать цвет` : 'Выбрать цвет'} />
      </label>
      <div className="min-w-0 flex-1">
        {label && <div className="mb-1 truncate text-[13px] font-medium text-zinc-700">{label}</div>}
        <input
          type="text"
          value={text}
          disabled={disabled}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value.trim();
            setText(v);
            if (isHexColor(v)) onChange(expand(v).toUpperCase());
          }}
          onBlur={() => {
            if (!isHexColor(text)) setText(value);
          }}
          className={cn(controlBase, 'h-9 px-2.5 font-mono text-[13px] uppercase', !valid && 'border-red-400')}
          aria-label={label ?? 'HEX цвет'}
        />
      </div>
    </div>
  );
}
