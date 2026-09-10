import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariant } from './Button';
import { Spinner } from './Spinner';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name (required). */
  label: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const sizes = { sm: 'size-8 rounded-lg [&>svg]:size-4', md: 'size-10 md:size-9 rounded-[10px] [&>svg]:size-4', lg: 'size-11 rounded-[10px] [&>svg]:size-5' };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={cn('inline-flex shrink-0 items-center justify-center transition-colors focus-ring', buttonVariants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : children}
    </button>
  );
});
