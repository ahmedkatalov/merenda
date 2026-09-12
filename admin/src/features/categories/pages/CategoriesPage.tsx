import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderTree, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category } from '@merenda/shared';
import { cn, pluralize } from '@/lib/utils';
import { mediaUrl } from '@/lib/media';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, IconButton, PageHeader, SkeletonRows, SortableList, Switch, Tabs } from '@/components/ui';
import { useMenus } from '@/features/menus/hooks';
import { useProducts } from '@/features/products/hooks';
import { useCategories, useDeleteCategory, useReorderCategories, useUpdateCategory } from '../hooks';
import { CategoryForm } from '../components/CategoryForm';

export default function CategoriesPage() {
  const menus = useMenus();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const menuId = params.get('menuId') ?? '';
  useEffect(() => {
    if (!menuId && menus.data?.[0]) setParams({ menuId: menus.data[0].id }, { replace: true });
  }, [menuId, menus.data, setParams]);

  const categories = useCategories(menuId || null, !!menuId);
  const products = useProducts({ menuId: menuId || undefined }, !!menuId);
  const update = useUpdateCategory(menuId, { silent: true });
  const remove = useDeleteCategory();
  const reorder = useReorderCategories(menuId);
  const [editing, setEditing] = useState<Category | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products.data ?? []) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    return map;
  }, [products.data]);

  const noMenus = menus.isSuccess && menus.data.length === 0;

  return (
    <>
      <PageHeader
        title="Категории"
        description="Разделы внутри меню. Перетаскивайте, чтобы изменить порядок на сайте."
        actions={
          <Button variant="primary" icon={<Plus />} onClick={() => setEditing('new')} disabled={!menuId}>
            Добавить категорию
          </Button>
        }
      >
        {menus.data && menus.data.length > 0 && <Tabs items={menus.data.map((m) => ({ value: m.id, label: m.name }))} value={menuId} onChange={(v) => setParams({ menuId: v })} />}
      </PageHeader>

      {menus.isError ? (
        <ErrorState error={menus.error} onRetry={() => void menus.refetch()} />
      ) : noMenus ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-zinc-200 bg-white">
          <EmptyState icon={<FolderTree />} title="Сначала создайте меню" description="Категории живут внутри меню — например «Кухня» или «Бар»." action={<Button variant="primary" onClick={() => navigate('/menus')}>Перейти к меню</Button>} />
        </div>
      ) : categories.isPending || menus.isPending ? (
        <SkeletonRows rows={4} height="h-16" />
      ) : categories.isError ? (
        <ErrorState error={categories.error} onRetry={() => void categories.refetch()} />
      ) : categories.data.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-zinc-200 bg-white">
          <EmptyState icon={<FolderTree />} title="В этом меню нет категорий" description="Добавьте первую категорию, например «Завтраки» или «Кофе»." action={<Button variant="primary" icon={<Plus />} onClick={() => setEditing('new')}>Добавить категорию</Button>} />
        </div>
      ) : (
        <SortableList
          items={categories.data}
          getId={(c) => c.id}
          onReorder={(items) => reorder.mutate(items.map((c) => c.id))}
          className="gap-2"
          renderItem={(cat, { handle, isDragging }) => (
            <div className={cn('flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 pl-1 pr-2 shadow-soft sm:gap-3 sm:pr-3', isDragging && 'shadow-pop ring-1 ring-zinc-300')}>
              {handle}
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-zinc-400">
                {cat.image ? <img src={mediaUrl(cat.image.thumbUrl)} alt="" className="size-full object-cover" /> : <ImageIcon className="size-4" />}
              </div>
              <button type="button" onClick={() => setEditing(cat)} className="min-w-0 flex-1 text-left focus-ring rounded-md">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-zinc-900">{cat.name}</span>
                  {!cat.isActive && (
                    <Badge tone="neutral" size="sm">
                      Скрыто
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 text-[12.5px] text-zinc-500">{pluralize(counts.get(cat.id) ?? 0, ['блюдо', 'блюда', 'блюд'])}</div>
              </button>
              <Switch size="sm" checked={cat.isActive} onCheckedChange={(v) => update.mutate({ id: cat.id, body: { isActive: v } })} aria-label="Показывать на сайте" />
              <IconButton label="Редактировать" size="sm" className="hidden sm:inline-flex" onClick={() => setEditing(cat)}>
                <Pencil />
              </IconButton>
              <IconButton label="Удалить" size="sm" className="text-zinc-400 hover:text-red-600" onClick={() => setDeleting(cat)}>
                <Trash2 />
              </IconButton>
            </div>
          )}
        />
      )}

      {menus.data && <CategoryForm open={editing !== null} onClose={() => setEditing(null)} category={editing === 'new' ? null : editing} menus={menus.data} menuId={menuId} />}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        title={`Удалить категорию «${deleting?.name}»?`}
        description={`Все блюда этой категории (${counts.get(deleting?.id ?? '') ?? 0}) будут удалены. Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}
