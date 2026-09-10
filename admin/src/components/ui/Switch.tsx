import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  label?: string;
  description?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, size = 'md', label, description, className, disabled, ...rest },
  ref,
) {
  const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const knob = size === 'sm' ? 'size-4 translate-x-0.5 data-[on=true]:translate-x-[18px]' : 'size-5 translate-x-0.5 data-[on=true]:translate-x-[22px]';
  const control = (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={!label ? rest['aria-label'] : undefined}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors focus-ring',
        track,
        checked ? 'bg-emerald-500' : 'bg-zinc-300 hover:bg-zinc-400/80',
        disabled && 'cursor-not-allowed opacity-50',
        !label && className,
      )}
      {...rest}
    >
      <span data-on={checked} className={cn('pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform', knob)} />
    </button>
  );
  if (!label) return control;
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4 py-1', disabled && 'cursor-not-allowed', className)}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-800">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] leading-snug text-zinc-500">{description}</span>}
      </span>
      {control}
    </label>
  );
});
