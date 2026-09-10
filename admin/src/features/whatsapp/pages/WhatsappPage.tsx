import { Check, MessageCircle, Power } from 'lucide-react';
import type { OrderSettings } from '@merenda/shared';
import { Badge, ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { useSetting } from '@/features/settings/hooks';
import { OrderSettingsForm } from '../components/OrderSettingsForm';
import { hasWhatsappNumber } from '../lib/buildMessage';

/** At-a-glance state of the saved settings. */
function StatusStrip({ settings }: { settings: OrderSettings }) {
  const connected = hasWhatsappNumber(settings.whatsappNumber);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={settings.enabled ? 'success' : 'neutral'} icon={settings.enabled ? <Check /> : <Power />}>
        {settings.enabled ? 'Заказы включены' : 'Заказы выключены'}
      </Badge>
      <Badge tone={connected ? 'success' : 'warning'} icon={<MessageCircle />}>
        {connected ? 'WhatsApp подключён' : 'WhatsApp не настроен'}
      </Badge>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="space-y-5">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl lg:self-start" />
    </div>
  );
}

export default function WhatsappPage() {
  const query = useSetting('orders');
  const settings = query.data;

  return (
    <>
      <PageHeader title="WhatsApp и заказы" description="Как гости оформляют заказы на сайте и что приходит вам в WhatsApp.">
        {settings && <StatusStrip settings={settings} />}
      </PageHeader>

      {settings ? <OrderSettingsForm initial={settings} /> : query.isError ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : <PageSkeleton />}
    </>
  );
}
