import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const controlBase =
  'w-full rounded-[10px] border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus-ring hover:border-zinc-300 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500';
export const controlInvalid = 'border-red-400 hover:border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  invalid?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  inputSize?: 'sm' | 'md';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, prefix, suffix, inputSize = 'md', ...rest },
  ref,
) {
  const height = inputSize === 'sm' ? 'h-9' : 'h-10';
  if (!prefix && !suffix) {
    return <input ref={ref} className={cn(controlBase, height, 'px-3', invalid && controlInvalid, className)} aria-invalid={invalid || undefined} {...rest} />;
  }
  return (
    <div className={cn('relative flex items-center', className)}>
      {prefix && <span className="pointer-events-none absolute left-3 inline-flex text-zinc-400 [&>svg]:size-4">{prefix}</span>}
      <input
        ref={ref}
        className={cn(controlBase, height, prefix ? 'pl-9' : 'pl-3', suffix ? 'pr-10' : 'pr-3', invalid && controlInvalid)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      {suffix && <span className="absolute right-2 inline-flex items-center text-zinc-400 [&>svg]:size-4">{suffix}</span>}
    </div>
  );
});
