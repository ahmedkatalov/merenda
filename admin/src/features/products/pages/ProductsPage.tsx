import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChefHat, ImageIcon, Info, Pencil, Plus, SearchX, Trash2 } from 'lucide-react';
import type { Availability, ProductListItem } from '@merenda/shared';
import { cn, pluralize } from '@/lib/utils';
import { mediaUrl } from '@/lib/media';
import { qk } from '@/lib/queryKeys';
import { Button, ConfirmDialog, EmptyState, ErrorState, IconButton, PageHeader, SkeletonRows, SortableList, Badge } from '@/components/ui';
import { useMenus } from '@/features/menus/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useDeleteProduct, useProducts, useQuickPrice, useReorderProducts, useSetAvailability } from '../hooks';
import { ProductsToolbar, type ProductListFilters } from '../components/ProductsToolbar';
import { PriceEditor } from '../components/PriceEditor';
import { AvailabilityControl } from '../components/AvailabilityControl';
import { ProductBadges } from '../components/ProductBadges';

const AVAILABILITY_SET = new Set<string>(['available', 'unavailable', 'hidden']);

function ProductRow({
  product,
  handle,
  isDragging,
  onDelete,
  onAvailability,
  onPrice,
  busy,
}: {
  product: ProductListItem;
  handle?: React.ReactNode;
  isDragging?: boolean;
  onDelete: () => void;
  onAvailability: (v: Availability) => void;
  onPrice: (minor: number) => void;
  busy: boolean;
}) {
  const navigate = useNavigate();
  const hidden = product.availability === 'hidden';
  return (
    <div
      className={cn(
        'flex flex-col gap-3 bg-white px-3 py-3 transition-shadow sm:flex-row sm:items-center sm:gap-3 sm:py-2.5 sm:pl-2 sm:pr-3',
        isDragging && 'rounded-xl shadow-pop ring-1 ring-zinc-300',
        hidden && 'bg-zinc-50/60',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {handle}
        <Link
          to={`/products/${product.id}`}
          className={cn('flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-zinc-400 focus-ring', hidden && 'opacity-60')}
          aria-label={`Открыть «${product.name}»`}
        >
          {product.image ? (
            <img src={mediaUrl(product.image.thumbUrl)} alt="" loading="lazy" className="size-full object-cover" />
          ) : product.gif ? (
            <img src={mediaUrl(product.gif.thumbUrl)} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-4" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link to={`/products/${product.id}`} className={cn('truncate text-sm font-semibold text-zinc-900 hover:underline focus-ring rounded', hidden && 'text-zinc-500')}>
              {product.name}
            </Link>
            <ProductBadges product={product} />
            {product.gif && (
              <Badge tone="dark" size="sm">
                GIF
              </Badge>
            )}
          </div>
          <div className="mt-0.5 truncate text-[12.5px] text-zinc-500">
            {product.categoryName}
            <span className="text-zinc-300"> · </span>
            {product.menuName}
          </div>
        </div>
        <div className="hidden shrink-0 sm:block">
          <PriceEditor priceMinor={product.priceMinor} oldPriceMinor={product.oldPriceMinor} onSave={onPrice} saving={busy} />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <div className="sm:hidden">
          <PriceEditor priceMinor={product.priceMinor} oldPriceMinor={product.oldPriceMinor} onSave={onPrice} saving={busy} />
        </div>
        <div className="flex-1 sm:flex-none">
          <div className="lg:hidden">
            <AvailabilityControl value={product.availability} onChange={onAvailability} compact fullWidth size="md" />
          </div>
          <div className="hidden lg:block">
            <AvailabilityControl value={product.availability} onChange={onAvailability} size="sm" />
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <IconButton label="Редактировать" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
            <Pencil />
          </IconButton>
          <IconButton label="Удалить" size="sm" className="text-zinc-400 hover:text-red-600" onClick={onDelete}>
            <Trash2 />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const filters: ProductListFilters = useMemo(() => {
    const availability = params.get('availability') ?? '';
    return {
      q: params.get('q') ?? '',
      menuId: params.get('menuId') ?? '',
      categoryId: params.get('categoryId') ?? '',
      availability: (AVAILABILITY_SET.has(availability) ? availability : '') as Availability | '',
    };
  }, [params]);

  const onFilters = useCallback(
    (next: Partial<ProductListFilters>) => {
      const merged = { ...filters, ...next };
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(merged)) if (v) out[k] = v;
      setParams(out, { replace: true });
    },
    [filters, setParams],
  );

  const menus = useMenus();
  const categories = useCategories(filters.menuId || null);
  const listFilters = { menuId: filters.menuId || undefined, categoryId: filters.categoryId || undefined, availability: filters.availability || undefined, q: filters.q || undefined };
  const products = useProducts(listFilters);
  // Unfiltered-by-availability list for the chip counters (same query when no availability filter).
  const allForCounts = useProducts({ ...listFilters, availability: undefined });

  const counts = useMemo(() => {
    const list = allForCounts.data ?? [];
    const c = { all: list.length, available: 0, unavailable: 0, hidden: 0 };
    for (const p of list) c[p.availability] += 1;
    return c;
  }, [allForCounts.data]);

  const setAvailability = useSetAvailability();
  const quickPrice = useQuickPrice();
  const remove = useDeleteProduct();
  const listKey = qk.products({ menuId: listFilters.menuId, categoryId: listFilters.categoryId, availability: listFilters.availability, q: listFilters.q?.trim() || undefined });
  const reorder = useReorderProducts(listKey);
  const [deleting, setDeleting] = useState<ProductListItem | null>(null);

  const canReorder = !!filters.categoryId && !filters.q && !filters.availability;
  const hasFilters = !!(filters.q || filters.menuId || filters.categoryId || filters.availability);
  const items = products.data ?? [];

  const rowProps = (p: ProductListItem) => ({
    product: p,
    busy: (quickPrice.isPending && quickPrice.variables?.id === p.id) || (setAvailability.isPending && setAvailability.variables?.id === p.id),
    onDelete: () => setDeleting(p),
    onAvailability: (v: Availability) => setAvailability.mutate({ id: p.id, availability: v }),
    onPrice: (minor: number) => quickPrice.mutate({ id: p.id, priceMinor: minor }),
  });

  return (
    <>
      <PageHeader
        title="Блюда"
        description="Все позиции меню. Цену и наличие можно менять прямо в списке."
        actions={
          <Link to="/products/new">
            <Button variant="primary" icon={<Plus />}>
              Добавить блюдо
            </Button>
          </Link>
        }
      >
        <ProductsToolbar filters={filters} onChange={onFilters} menus={menus.data ?? []} categories={categories.data ?? []} counts={counts} />
      </PageHeader>

      {products.isPending ? (
        <SkeletonRows rows={6} height="h-[68px]" />
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => void products.refetch()} />
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-zinc-200 bg-white">
          {hasFilters ? (
            <EmptyState
              icon={<SearchX />}
              title="Ничего не найдено"
              description="Попробуйте изменить запрос или сбросить фильтры."
              action={
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  Сбросить фильтры
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<ChefHat />}
              title="Блюд пока нет"
              description="Добавьте первое блюдо — оно сразу появится на сайте в своей категории."
              action={
                <Link to="/products/new">
                  <Button variant="primary" icon={<Plus />}>
                    Добавить блюдо
                  </Button>
                </Link>
              }
            />
          )}
        </div>
      ) : (
        <>
          <div className={cn('mb-2 flex items-center justify-between gap-3 text-[12.5px] text-zinc-500', products.isFetching && !products.isPending && 'opacity-70')}>
            <span>{pluralize(items.length, ['блюдо', 'блюда', 'блюд'])}</span>
            {!canReorder && (
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <Info className="size-3.5" />
                {filters.categoryId ? 'Сбросьте поиск и фильтр наличия, чтобы менять порядок' : 'Выберите категорию, чтобы менять порядок блюд'}
              </span>
            )}
          </div>
          {canReorder ? (
            <SortableList
              items={items}
              getId={(p) => p.id}
              onReorder={(next) => reorder.mutate(next.map((p) => p.id))}
              className="divide-y divide-zinc-100 overflow-hidden rounded-[var(--radius-card)] border border-zinc-200 bg-white shadow-soft"
              renderItem={(p, { handle, isDragging }) => <ProductRow {...rowProps(p)} handle={handle} isDragging={isDragging} />}
            />
          ) : (
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-[var(--radius-card)] border border-zinc-200 bg-white shadow-soft">
              {items.map((p) => (
                <li key={p.id}>
                  <ProductRow {...rowProps(p)} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        title={`Удалить блюдо «${deleting?.name}»?`}
        description="Блюдо исчезнет с сайта. Это действие нельзя отменить."
        confirmLabel="Удалить"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}
