import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  full?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

export type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
export type ButtonLinkProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement>;

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[0.875rem]',
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-12 px-6 text-base md:h-[3.25rem]',
};

const ICON_SIZE: Record<Size, string> = {
  sm: 'size-9',
  md: 'size-11',
  lg: 'size-12',
};

export function buttonClass({ variant = 'primary', size = 'md', iconOnly, full, className }: BaseProps & { className?: string }): string {
  return cn('btn', VARIANT[variant], iconOnly ? cn(ICON_SIZE[size], 'px-0') : SIZE[size], full && 'w-full', className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, iconOnly, full, loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, iconOnly, full, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
});

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant, size, iconOnly, full, className, children, ...rest },
  ref,
) {
  return (
    <a ref={ref} className={buttonClass({ variant, size, iconOnly, full, className })} {...rest}>
      {children}
    </a>
  );
});
