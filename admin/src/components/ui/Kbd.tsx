import { cn } from '@/lib/utils';

export function Kbd({ children, className }: { children: string; className?: string }) {
  return (
    <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-1 font-sans text-[11px] font-medium text-zinc-500', className)}>
      {children}
    </kbd>
  );
}
