import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  padding?: 'none' | 'sm' | 'md';
  footer?: ReactNode;
}

export function Card({ title, description, actions, padding = 'md', footer, className, children, ...rest }: CardProps) {
  const pad = padding === 'none' ? '' : padding === 'sm' ? 'p-4' : 'p-5';
  return (
    <section className={cn('overflow-hidden rounded-[var(--radius-card)] border border-zinc-200 bg-white shadow-soft', className)} {...rest}>
      {(title || actions) && (
        <header className={cn('flex items-start justify-between gap-4 px-5 pt-5', !children && !footer && 'pb-5', children && 'pb-3')}>
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-semibold text-zinc-900">{title}</h3>}
            {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children !== undefined && <div className={cn(pad, title && padding === 'md' && 'pt-1')}>{children}</div>}
      {footer && <footer className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-3">{footer}</footer>}
    </section>
  );
}
