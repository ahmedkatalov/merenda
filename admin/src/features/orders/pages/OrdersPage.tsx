import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RefreshCw, ShoppingBag } from 'lucide-react';
import { formatMoney, ORDER_STATUS_VALUES, ORDER_TYPE_LABELS, type Order, type OrderStatus, type OrderType } from '@merenda/shared';
import { cn, formatDateTime, formatRelative, pluralize } from '@/lib/utils';
import { ORDER_STATUS_FILTER_LABELS } from '@/lib/i18n';
import { Badge, Button, EmptyState, ErrorState, IconButton, PageHeader, Select, Table, Tabs, type Column } from '@/components/ui';
import { useDashboard } from '@/features/dashboard/hooks';
import { ORDERS_PER_PAGE, useOrders } from '../hooks';
import { OrderStatusBadge } from '../components/OrderStatusBadge';

type StatusFilter = OrderStatus | 'all';
const STATUS_ORDER: StatusFilter[] = ['new', 'confirmed', 'completed', 'cancelled', 'all'];

function itemsSummary(order: Order): string {
  return order.items.map((i) => (i.quantity > 1 ? `${i.name} × ${i.quantity}` : i.name)).join(', ');
}

export function OrderTypeBadge({ type, size = 'sm' }: { type: OrderType; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={type === 'takeaway' ? 'warning' : 'neutral'} size={size}>
      {ORDER_TYPE_LABELS[type]}
    </Badge>
  );
}

export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const statusParam = params.get('status') ?? 'new';
  const status: StatusFilter = (ORDER_STATUS_VALUES as string[]).includes(statusParam) ? (statusParam as OrderStatus) : 'all';
  const typeParam = params.get('type') ?? '';
  const type: OrderType | '' = typeParam === 'dine_in' || typeParam === 'takeaway' ? typeParam : '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const setFilter = (next: { status?: StatusFilter; type?: OrderType | ''; page?: number }) => {
    const out: Record<string, string> = {};
    const s = next.status ?? status;
    const t = next.type ?? type;
    const p = next.page ?? 1;
    out.status = s;
    if (t) out.type = t;
    if (p > 1) out.page = String(p);
    setParams(out, { replace: true });
  };

  const query = useOrders({ status: status === 'all' ? undefined : status, type: type || undefined, page, perPage: ORDERS_PER_PAGE });
  const dashboard = useDashboard();
  const newCount = dashboard.data?.orders.new ?? 0;

  const data = query.data;
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / ORDERS_PER_PAGE));
  const from = total === 0 ? 0 : (page - 1) * ORDERS_PER_PAGE + 1;
  const to = Math.min(total, page * ORDERS_PER_PAGE);

  const columns = useMemo<Column<Order>[]>(
    () => [
      { key: 'number', header: '№', width: '80px', cell: (o) => <span className="font-semibold tabular-nums text-zinc-900">№{o.number}</span> },
      {
        key: 'time',
        header: 'Время',
        width: '160px',
        cell: (o) => (
          <div className="leading-tight">
            <div className="text-zinc-900">{formatRelative(o.createdAt)}</div>
            <div className="text-[12px] text-zinc-500">{formatDateTime(o.createdAt)}</div>
          </div>
        ),
      },
      { key: 'type', header: 'Тип', width: '130px', cell: (o) => <OrderTypeBadge type={o.type} /> },
      {
        key: 'items',
        header: 'Состав',
        cell: (o) => (
          <div className="max-w-[420px]">
            <div className="truncate text-zinc-800" title={itemsSummary(o)}>
              {itemsSummary(o)}
            </div>
            <div className="text-[12px] text-zinc-500">
              {pluralize(o.items.reduce((n, i) => n + i.quantity, 0), ['позиция', 'позиции', 'позиций'])}
              {o.customerName ? ` · ${o.customerName}` : ''}
            </div>
          </div>
        ),
      },
      { key: 'total', header: 'Сумма', align: 'right', width: '120px', cell: (o) => <span className="font-semibold tabular-nums text-zinc-900">{formatMoney(o.totalMinor)}</span> },
      { key: 'status', header: 'Статус', width: '140px', align: 'right', cell: (o) => <OrderStatusBadge status={o.status} /> },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Заказы"
        description="Заказы, оформленные гостями на сайте. Список обновляется автоматически."
        actions={
          <IconButton label="Обновить" variant="secondary" onClick={() => void query.refetch()} loading={query.isFetching && !query.isPending}>
            <RefreshCw />
          </IconButton>
        }
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs<StatusFilter>
            variant="pills"
            size="sm"
            value={status}
            onChange={(v) => setFilter({ status: v, page: 1 })}
            items={STATUS_ORDER.map((s) => ({ value: s, label: ORDER_STATUS_FILTER_LABELS[s], badge: s === 'new' && newCount > 0 ? newCount : undefined }))}
          />
          <Select aria-label="Тип заказа" selectSize="sm" value={type} onChange={(e) => setFilter({ type: e.target.value as OrderType | '', page: 1 })} className="md:w-44" options={[{ value: '', label: 'Все типы' }, { value: 'dine_in', label: ORDER_TYPE_LABELS.dine_in }, { value: 'takeaway', label: ORDER_TYPE_LABELS.takeaway }]} />
        </div>
      </PageHeader>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className={cn(query.isFetching && !query.isPending && 'opacity-80 transition-opacity')}>
          <Table<Order>
            columns={columns}
            rows={rows}
            rowKey={(o) => o.id}
            loading={query.isPending}
            onRowClick={(o) => navigate(`/orders/${o.id}`)}
            rowClassName={(o) => (o.status === 'new' ? 'bg-brand-50/30' : undefined)}
            empty={
              <EmptyState
                icon={<ShoppingBag />}
                title={status === 'all' ? 'Заказов пока нет' : `Нет заказов со статусом «${ORDER_STATUS_FILTER_LABELS[status].toLowerCase()}»`}
                description={status === 'all' ? 'Как только гости оформят заказ на сайте, он появится здесь.' : 'Посмотрите другие статусы или все заказы.'}
                action={
                  status !== 'all' ? (
                    <Button variant="secondary" onClick={() => setFilter({ status: 'all', page: 1 })}>
                      Показать все
                    </Button>
                  ) : undefined
                }
              />
            }
            renderCard={(o) => (
              <Link to={`/orders/${o.id}`} className="block -m-4 p-4 focus-ring rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-zinc-900">№{o.number}</span>
                    <OrderTypeBadge type={o.type} />
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="mt-2 line-clamp-2 text-[13.5px] text-zinc-700">{itemsSummary(o)}</div>
                <div className="mt-2 flex items-center justify-between text-[12.5px] text-zinc-500">
                  <span>
                    {formatRelative(o.createdAt)} · {formatDateTime(o.createdAt)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-900">{formatMoney(o.totalMinor)}</span>
                </div>
              </Link>
            )}
          />
          {total > ORDERS_PER_PAGE && (
            <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-zinc-500">
              <span>
                Показано {from}–{to} из {total}
              </span>
              <div className="flex items-center gap-1">
                <IconButton label="Предыдущая страница" variant="secondary" size="sm" disabled={page <= 1} onClick={() => setFilter({ page: page - 1 })}>
                  <ChevronLeft />
                </IconButton>
                <span className="px-2 tabular-nums">
                  {page} / {pages}
                </span>
                <IconButton label="Следующая страница" variant="secondary" size="sm" disabled={page >= pages} onClick={() => setFilter({ page: page + 1 })}>
                  <ChevronRight />
                </IconButton>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
