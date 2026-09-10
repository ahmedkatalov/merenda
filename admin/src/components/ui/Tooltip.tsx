import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Tooltip({ content, children, side = 'top', className }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'right'; className?: string }) {
  const pos = {
    top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
    bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
    right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  }[side];
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[12px] font-medium text-white opacity-0 shadow-md transition-opacity delay-100 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
          pos,
        )}
      >
        {content}
      </span>
    </span>
  );
}
