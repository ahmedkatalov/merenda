import { Clock, Power } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SiteStatus } from '@merenda/shared';
import { Badge, Button, Card, StatusDot } from '@/components/ui';
import { venueStatusInfo } from '@/app/StatusPill';

export function VenueStatusCard({ status, onToggle }: { status: SiteStatus; onToggle: () => void }) {
  const info = venueStatusInfo(status.venue);
  const closed = status.venue.mode === 'temporarily_closed';
  return (
    <Card
      title="Статус заведения"
      actions={
        <Link to="/hours" className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900">
          Режим работы
        </Link>
      }
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <StatusDot tone={info.tone} pulse={info.pulse} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-zinc-900">{info.label}</div>
          <div className="mt-0.5 text-sm text-zinc-600">{closed ? status.venue.closedMessage || 'Заведение временно закрыто' : status.venue.message || 'Сегодня выходной'}</div>
          {!closed && status.venue.opensAt && (
            <div className="mt-1 text-[12.5px] text-zinc-400">
              Сегодня {status.venue.opensAt}–{status.venue.closesAt}
            </div>
          )}
        </div>
      </div>
      {status.schedules.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-100">
          {status.schedules.map((s) => (
            <li key={s.scheduleId} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-zinc-400" />
                <span className="font-medium text-zinc-800">{s.name}</span>
                <span className="hidden text-zinc-500 sm:inline">· {s.message}</span>
              </div>
              <Badge tone={s.isOpen ? 'success' : 'neutral'} size="sm">
                {s.isOpen ? 'Открыто' : 'Закрыто'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <Button variant={closed ? 'primary' : 'secondary'} icon={<Power />} onClick={onToggle}>
          {closed ? 'Открыть заведение' : 'Временно закрыть'}
        </Button>
      </div>
    </Card>
  );
}
