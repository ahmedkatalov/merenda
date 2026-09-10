import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, description, className, ...rest }, ref) {
  return (
    <label className={cn('group inline-flex cursor-pointer items-start gap-2.5', rest.disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className="relative mt-0.5 inline-flex size-[18px] shrink-0">
        <input ref={ref} type="checkbox" className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-[5px] border border-zinc-300 bg-white transition-colors checked:border-zinc-900 checked:bg-zinc-900 focus-ring" {...rest} />
        <Check className="pointer-events-none absolute inset-0 m-auto size-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm text-zinc-800">{label}</span>}
          {description && <span className="block text-[13px] text-zinc-500">{description}</span>}
        </span>
      )}
    </label>
  );
});
