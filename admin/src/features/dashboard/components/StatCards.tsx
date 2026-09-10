import { Link } from 'react-router-dom';
import type { DashboardStats } from '@merenda/shared';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui';

interface Stat {
  label: string;
  value: number;
  to: string;
  tone?: 'success' | 'warning' | 'muted' | 'accent';
}

export function StatCards({ data }: { data: DashboardStats | undefined }) {
  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-xl" />
        ))}
      </div>
    );
  }
  const stats: Stat[] = [
    { label: 'Блюд всего', value: data.products.total, to: '/products' },
    { label: 'В наличии', value: data.products.available, to: '/products?availability=available', tone: 'success' },
    { label: 'Нет в наличии', value: data.products.unavailable, to: '/products?availability=unavailable', tone: 'warning' },
    { label: 'Скрыто', value: data.products.hidden, to: '/products?availability=hidden', tone: 'muted' },
    { label: 'Категорий', value: data.categories, to: '/categories' },
    { label: 'Новых заказов', value: data.orders.new, to: '/orders?status=new', tone: 'accent' },
    { label: 'Заказов сегодня', value: data.orders.today, to: '/orders' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
      {stats.map((s) => (
        <Link key={s.label} to={s.to} className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-soft transition-colors hover:border-zinc-300 focus-ring">
          <div className="text-[12px] font-medium text-zinc-500">{s.label}</div>
          <div
            className={cn(
              'mt-1.5 text-2xl font-semibold tabular-nums tracking-tight',
              s.tone === 'success' && 'text-emerald-700',
              s.tone === 'warning' && 'text-amber-700',
              s.tone === 'muted' && 'text-zinc-500',
              s.tone === 'accent' && (s.value > 0 ? 'text-brand-700' : 'text-zinc-900'),
              !s.tone && 'text-zinc-900',
            )}
          >
            {s.value}
          </div>
        </Link>
      ))}
    </div>
  );
}
