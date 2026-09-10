import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<V extends string = string> {
  value: V;
  label: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
}

export interface TabsProps<V extends string> {
  items: TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
  variant?: 'underline' | 'pills';
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs<V extends string>({ items, value, onChange, variant = 'underline', className, size = 'md' }: TabsProps<V>) {
  return (
    <div role="tablist" className={cn('flex items-center gap-1 overflow-x-auto no-scrollbar', variant === 'underline' && 'border-b border-zinc-200', className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium transition-colors focus-ring',
              size === 'sm' ? 'text-[13px]' : 'text-sm',
              variant === 'underline' && cn('-mb-px border-b-2 px-3 py-2.5', active ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'),
              variant === 'pills' && cn('rounded-lg px-3 py-1.5', active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'),
            )}
          >
            {it.icon && <span className="inline-flex [&>svg]:size-4">{it.icon}</span>}
            {it.label}
            {it.badge !== undefined && it.badge !== null && (
              <span className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums', active && variant === 'pills' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600')}>
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
