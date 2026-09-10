import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AccordionSection({ title, children, defaultOpen = true, className, badge }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string; badge?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn('rounded-xl border border-zinc-200 bg-white', className)}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus-ring rounded-xl">
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          {title}
          {badge}
        </span>
        <ChevronDown className={cn('size-4 text-zinc-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="space-y-4 border-t border-zinc-100 px-4 py-4">{children}</div>}
    </div>
  );
}
