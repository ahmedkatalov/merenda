import { useState } from 'react';
import { ExternalLink, Plus, Power } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE_URL } from '@/lib/env';
import { Button, ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks';
import { useDashboard } from '../hooks';
import { StatCards } from '../components/StatCards';
import { VenueStatusCard } from '../components/VenueStatusCard';
import { WarningsList } from '../components/WarningsList';
import { RecentOrders } from '../components/RecentOrders';
import { VenueStatusDialog } from '../components/VenueStatusDialog';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const query = useDashboard({ refetchInterval: 30_000 });
  const [statusOpen, setStatusOpen] = useState(false);
  const data = query.data;
  const closed = data?.status.venue.mode === 'temporarily_closed';

  return (
    <>
      <PageHeader
        title={`${greeting()}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Сводка по сайту и быстрые действия."
        actions={
          <>
            <Button variant="secondary" icon={<Power />} onClick={() => setStatusOpen(true)} disabled={!data}>
              {closed ? 'Открыть заведение' : 'Временно закрыть'}
            </Button>
            <a href={SITE_URL} target="_blank" rel="noreferrer" className="inline-flex">
              <Button variant="secondary" iconRight={<ExternalLink />}>
                Открыть сайт
              </Button>
            </a>
            <Link to="/products/new">
              <Button variant="primary" icon={<Plus />}>
                Добавить блюдо
              </Button>
            </Link>
          </>
        }
      />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="space-y-5">
          <StatCards data={data} />
          {data && <WarningsList warnings={data.warnings} />}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {data ? <VenueStatusCard status={data.status} onToggle={() => setStatusOpen(true)} /> : <Skeleton className="h-64 rounded-xl" />}
            {data ? <RecentOrders orders={data.recentOrders} /> : <Skeleton className="h-64 rounded-xl" />}
          </div>
        </div>
      )}
      <VenueStatusDialog open={statusOpen} onClose={() => setStatusOpen(false)} current={data ? { mode: data.status.venue.mode, message: data.status.venue.closedMessage } : undefined} />
    </>
  );
}
