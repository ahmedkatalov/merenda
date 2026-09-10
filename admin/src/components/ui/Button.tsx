import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 border border-transparent shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] disabled:bg-zinc-300 disabled:text-white',
  secondary: 'bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100 disabled:text-zinc-400 disabled:bg-zinc-50',
  outline: 'bg-transparent text-zinc-800 border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 disabled:text-zinc-400',
  ghost: 'bg-transparent text-zinc-700 border border-transparent hover:bg-zinc-100 active:bg-zinc-200 disabled:text-zinc-400',
  danger: 'bg-red-600 text-white border border-transparent hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
};

export const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 md:h-9 px-3.5 text-sm gap-2 rounded-[10px]',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-[10px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, icon, iconRight, fullWidth, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors focus-ring',
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 16} /> : icon ? <span className="-ml-0.5 inline-flex shrink-0 [&>svg]:size-4">{icon}</span> : null}
      {children && <span className="truncate">{children}</span>}
      {iconRight && !loading && <span className="-mr-0.5 inline-flex shrink-0 [&>svg]:size-4">{iconRight}</span>}
    </button>
  );
});
