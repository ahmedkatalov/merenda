import { LayoutGroup, motion } from 'motion/react';
import type { PublicMenu, SiteStatus } from '@merenda/shared';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface Props {
  menus: PublicMenu[];
  activeId: string;
  onChange: (id: string) => void;
  status: SiteStatus;
}

export function menuStatusHint(menu: PublicMenu, status: SiteStatus): string | null {
  if (!menu.scheduleId) return null;
  const s = status.schedules.find((x) => x.scheduleId === menu.scheduleId);
  return s?.message || null;
}

/** Segmented control for switching between menus (e.g. Кухня / Бар). */
export function MenuTabs({ menus, activeId, onChange, status }: Props) {
  const active = menus.find((m) => m.id === activeId) ?? menus[0];
  const hint = active ? menuStatusHint(active, status) : null;
  const activeSchedule = active?.scheduleId ? status.schedules.find((x) => x.scheduleId === active.scheduleId) : undefined;

  return (
    <div className="mb-6 flex flex-col items-start gap-3 md:mb-8">
      <LayoutGroup id="menu-tabs">
        <div role="tablist" aria-label={t.menu.menus} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-[calc(var(--radius-button)+4px)] bg-surface-alt p-1 scrollbar-none">
          {menus.map((menu) => {
            const isActive = menu.id === active?.id;
            return (
              <button
                key={menu.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onChange(menu.id)}
                className={cn(
                  'relative inline-flex h-10 shrink-0 items-center gap-2 rounded-button px-4 text-[0.9375rem] font-semibold transition-colors',
                  isActive ? 'text-heading' : 'text-muted hover:text-heading',
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="menu-tab-indicator"
                    className="absolute inset-0 rounded-button bg-surface-solid shadow-card"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                ) : null}
                <span className="relative inline-flex items-center gap-2">
                  {menu.icon ? <Icon name={menu.icon} className="size-4" strokeWidth={1.75} aria-hidden /> : null}
                  {menu.name}
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      {hint ? (
        <p className={cn('flex items-center gap-2 text-[0.875rem]', activeSchedule && !activeSchedule.isOpen ? 'text-warning' : 'text-muted')}>
          <span className={cn('size-1.5 rounded-full', activeSchedule?.isOpen ? 'bg-success' : 'bg-warning')} aria-hidden />
          {hint}
        </p>
      ) : null}
    </div>
  );
}
