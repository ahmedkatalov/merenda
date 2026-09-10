import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { StatusDot, type StatusTone } from '@/components/ui';
import { useDashboard } from '@/features/dashboard/hooks';

export function venueStatusInfo(status: { mode: string; isOpen: boolean } | undefined): { label: string; tone: StatusTone; pulse: boolean } {
  if (!status) return { label: 'Статус', tone: 'neutral', pulse: false };
  if (status.mode === 'temporarily_closed') return { label: 'Временно закрыто', tone: 'danger', pulse: false };
  if (status.isOpen) return { label: 'Открыто', tone: 'success', pulse: true };
  return { label: 'Закрыто', tone: 'neutral', pulse: false };
}

export function StatusPill() {
  const { data } = useDashboard();
  const info = venueStatusInfo(data?.status.venue);
  return (
    <Link
      to="/hours"
      title={data?.status.venue.message || 'Режим работы'}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors focus-ring',
        info.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70',
        info.tone === 'danger' && 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100/70',
        info.tone === 'neutral' && 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100',
      )}
    >
      <StatusDot tone={info.tone} pulse={info.pulse} />
      <span className="hidden sm:inline">{info.label}</span>
    </Link>
  );
}
