import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton, Portal, Tooltip, useEscape, useMountTransition, useScrollLock } from '@/components/ui/internal';
import { useDashboard } from '@/features/dashboard/hooks';
import { NAV_ITEMS } from './nav';
import { Wordmark } from './Wordmark';

function NavList({ compact }: { compact: boolean }) {
  const { data } = useDashboard();
  const newOrders = data?.orders.new ?? 0;
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-2" aria-label="Основная навигация">
      {NAV_ITEMS.map((item) => {
        const badge = item.ordersBadge && newOrders > 0 ? newOrders : null;
        const link = (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center gap-3 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors focus-ring',
                compact && 'justify-center px-0',
                isActive ? 'bg-zinc-900 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
              )
            }
          >
            <item.icon className="size-[18px] shrink-0" strokeWidth={1.9} />
            {!compact && <span className="flex-1 truncate">{item.label}</span>}
            {badge !== null && (
              <span className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-semibold text-white', compact && 'absolute -right-1 -top-1')}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </NavLink>
        );
        return compact ? (
          <Tooltip key={item.to} content={item.label} side="right" className="w-full">
            {link}
          </Tooltip>
        ) : (
          link
        );
      })}
    </nav>
  );
}

/** Desktop: full sidebar ≥ lg, icon rail on md. Hidden on mobile. */
export function Sidebar() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex h-14 items-center px-5">
          <Wordmark />
        </div>
        <NavList compact={false} />
        <div className="px-5 py-4 text-[11px] text-zinc-400">Merenda Admin · v1.0</div>
      </aside>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[68px] flex-col border-r border-zinc-200 bg-white md:flex lg:hidden">
        <div className="flex h-14 items-center justify-center">
          <Wordmark compact />
        </div>
        <NavList compact />
      </aside>
    </>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mounted, visible } = useMountTransition(open, 220);
  useScrollLock(mounted);
  useEscape(open, onClose);
  if (!mounted) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[55] md:hidden" role="dialog" aria-modal="true" aria-label="Меню">
        <div className={cn('absolute inset-0 bg-zinc-900/40 transition-opacity duration-200', visible ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
        <div className={cn('absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col bg-white shadow-pop transition-transform duration-200 ease-out', visible ? 'translate-x-0' : '-translate-x-full')}>
          <div className="flex h-14 items-center justify-between px-4">
            <Wordmark />
            <IconButton label="Закрыть" onClick={onClose} size="sm">
              <X />
            </IconButton>
          </div>
          <NavList compact={false} />
          <div className="px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[11px] text-zinc-400">Merenda Admin · v1.0</div>
        </div>
      </div>
    </Portal>
  );
}
