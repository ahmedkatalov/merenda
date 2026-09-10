import { useState } from 'react';
import { Pencil, Plus, Trash2, Utensils } from 'lucide-react';
import type { Menu } from '@merenda/shared';
import { cn } from '@/lib/utils';
import { iconByName } from '@/lib/icons';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, IconButton, PageHeader, SkeletonRows, SortableList, Switch } from '@/components/ui';
import { useDeleteMenu, useMenus, useReorderMenus, useSchedules, useUpdateMenu } from '../hooks';
import { MenuForm } from '../components/MenuForm';

export default function MenusPage() {
  const menus = useMenus();
  const schedules = useSchedules();
  const update = useUpdateMenu({ silent: true });
  const remove = useDeleteMenu();
  const reorder = useReorderMenus();
  const [editing, setEditing] = useState<Menu | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Menu | null>(null);

  const scheduleName = (id: string | null) => (id ? (schedules.data?.find((s) => s.id === id)?.name ?? '…') : 'Часы заведения');

  return (
    <>
      <PageHeader
        title="Меню"
        description="Разделы сайта верхнего уровня, например «Кухня» и «Бар». Перетаскивайте, чтобы изменить порядок."
        actions={
          <Button variant="primary" icon={<Plus />} onClick={() => setEditing('new')}>
            Добавить меню
          </Button>
        }
      />
      {menus.isPending ? (
        <SkeletonRows rows={3} height="h-16" />
      ) : menus.isError ? (
        <ErrorState error={menus.error} onRetry={() => void menus.refetch()} />
      ) : menus.data.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-zinc-200 bg-white">
          <EmptyState icon={<Utensils />} title="Меню пока нет" description="Создайте первое меню — например «Кухня» — и добавьте в него категории." action={<Button variant="primary" icon={<Plus />} onClick={() => setEditing('new')}>Создать меню</Button>} />
        </div>
      ) : (
        <SortableList
          items={menus.data}
          getId={(m) => m.id}
          onReorder={(items) => reorder.mutate(items.map((m) => m.id))}
          className="gap-2"
          renderItem={(menu, { handle, isDragging }) => {
            const Icon = iconByName(menu.icon);
            return (
              <div className={cn('flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 pl-1 pr-2 shadow-soft transition-shadow sm:gap-3 sm:pr-3', isDragging && 'shadow-pop ring-1 ring-zinc-300')}>
                {handle}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                  <Icon className="size-[18px]" />
                </div>
                <button type="button" onClick={() => setEditing(menu)} className="min-w-0 flex-1 text-left focus-ring rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-zinc-900">{menu.name}</span>
                    {!menu.isActive && (
                      <Badge tone="neutral" size="sm">
                        Скрыто
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-zinc-500">
                    {menu.description ? `${menu.description} · ` : ''}
                    {scheduleName(menu.scheduleId)}
                  </div>
                </button>
                <Switch size="sm" checked={menu.isActive} onCheckedChange={(v) => update.mutate({ id: menu.id, body: { isActive: v } })} aria-label="Показывать на сайте" />
                <div className="hidden items-center sm:flex">
                  <IconButton label="Редактировать" size="sm" onClick={() => setEditing(menu)}>
                    <Pencil />
                  </IconButton>
                  <IconButton label="Удалить" size="sm" className="text-zinc-400 hover:text-red-600" onClick={() => setDeleting(menu)}>
                    <Trash2 />
                  </IconButton>
                </div>
                <IconButton label="Удалить" size="sm" className="text-zinc-400 sm:hidden" onClick={() => setDeleting(menu)}>
                  <Trash2 />
                </IconButton>
              </div>
            );
          }}
        />
      )}
      <MenuForm open={editing !== null} onClose={() => setEditing(null)} menu={editing === 'new' ? null : editing} schedules={schedules.data ?? []} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        title={`Удалить меню «${deleting?.name}»?`}
        description="Вместе с меню будут удалены все его категории и блюда. Это действие нельзя отменить."
        confirmLabel="Удалить"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}
