import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { formatMoney, ORDER_TYPE_LABELS, type Order } from '@merenda/shared';
import { formatRelative, pluralize } from '@/lib/utils';
import { Card, EmptyState } from '@/components/ui';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';

export function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <Card
      title="Последние заказы"
      padding="none"
      actions={
        <Link to="/orders" className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900">
          Все заказы
        </Link>
      }
    >
      {orders.length === 0 ? (
        <EmptyState compact icon={<ShoppingBag />} title="Заказов пока нет" description="Как только гости оформят заказ на сайте, он появится здесь." />
      ) : (
        <ul className="divide-y divide-zinc-100">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-zinc-900">№{o.number}</span>
                    <span className="text-zinc-400">·</span>
                    <span className="text-zinc-600">{ORDER_TYPE_LABELS[o.type]}</span>
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-zinc-500">
                    {pluralize(o.items.reduce((n, i) => n + i.quantity, 0), ['позиция', 'позиции', 'позиций'])} · {formatRelative(o.createdAt)}
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-zinc-900">{formatMoney(o.totalMinor)}</div>
                <OrderStatusBadge status={o.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
