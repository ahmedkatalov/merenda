import { useEffect, useState } from 'react';
import { CalendarClock, Clock, Power, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { StatusSettings, VenueMode } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { VENUE_MODE_LABELS } from '@/lib/i18n';
import { cn, deepEqual } from '@/lib/utils';
import { Badge, Button, Card, ErrorState, FormField, SegmentedControl, Skeleton, StatusDot, Textarea, type SegmentOption } from '@/components/ui';
import { useSaveSetting, useSetting } from '@/features/settings/hooks';
import { venueStatusInfo } from '@/app/StatusPill';
import { useSiteStatus } from '../hooks';
import { formatServerTime } from '../utils';

const MESSAGE_MAX = 300;
const DEFAULT_CLOSED_MESSAGE = 'Сегодня мы закрыты. Ждём вас снова!';

/** Short labels below `sm` — the full ones do not fit two-up on a phone. */
const MODE_OPTIONS: SegmentOption<VenueMode>[] = [
  {
    value: 'auto',
    tone: 'success',
    icon: <CalendarClock />,
    label: (
      <>
        <span className="sm:hidden">По расписанию</span>
        <span className="hidden sm:inline">{VENUE_MODE_LABELS.auto}</span>
      </>
    ),
  },
  { value: 'temporarily_closed', tone: 'danger', icon: <Power />, label: VENUE_MODE_LABELS.temporarily_closed },
];

/** What actually gets stored: the message only matters while temporarily closed. */
function toPayload(value: StatusSettings): StatusSettings {
  return value.mode === 'temporarily_closed' ? { mode: 'temporarily_closed', message: value.message.trim() } : { mode: 'auto', message: '' };
}

export function StatusSettingsCard() {
  const setting = useSetting('status');
  const save = useSaveSetting('status', { silent: true });
  const [draft, setDraft] = useState<StatusSettings>({ mode: 'auto', message: '' });

  useEffect(() => {
    if (setting.data) setDraft({ mode: setting.data.mode, message: setting.data.message });
  }, [setting.data]);

  const closed = draft.mode === 'temporarily_closed';
  const dirty = !!setting.data && !deepEqual(toPayload(draft), toPayload(setting.data));

  const setMode = (mode: VenueMode) =>
    setDraft((d) => ({ mode, message: mode === 'temporarily_closed' && !d.message.trim() ? DEFAULT_CLOSED_MESSAGE : d.message }));

  const reset = () => {
    if (setting.data) setDraft({ mode: setting.data.mode, message: setting.data.message });
  };

  const submit = () => {
    const payload = toPayload(draft);
    save.mutate(payload, {
      onSuccess: () => toast.success(payload.mode === 'temporarily_closed' ? 'Заведение временно закрыто' : 'Заведение работает по расписанию'),
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  return (
    <Card
      title="Статус заведения"
      description="Что посетители видят на сайте прямо сейчас и как это решается."
      footer={
        setting.isSuccess && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12.5px] text-zinc-500">{dirty ? 'Есть несохранённые изменения.' : 'Изменения применяются на сайте сразу после сохранения.'}</p>
            <div className="flex gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
              <Button variant="secondary" onClick={reset} disabled={!dirty || save.isPending}>
                Отменить
              </Button>
              <Button variant="primary" onClick={submit} disabled={!dirty} loading={save.isPending}>
                Сохранить
              </Button>
            </div>
          </div>
        )
      }
    >
      {setting.isPending ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Skeleton className="h-40 rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ) : setting.isError ? (
        <ErrorState error={setting.error} onRetry={() => void setting.refetch()} className="py-8" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <LiveStatus />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="block text-[13px] font-medium text-zinc-700">Режим работы</span>
              <SegmentedControl aria-label="Режим работы" options={MODE_OPTIONS} value={draft.mode} onChange={setMode} fullWidth disabled={save.isPending} />
              <p className="text-[13px] text-zinc-500">
                {closed ? 'Сайт покажет сообщение вместо часов работы, а заказы будут заблокированы до отмены.' : 'Статус «Открыто» или «Закрыто» определяется по расписанию и особым датам ниже.'}
              </p>
            </div>
            {closed && (
              <FormField label="Сообщение для посетителей" help={`${draft.message.length}/${MESSAGE_MAX}`}>
                {(id) => (
                  <Textarea
                    id={id}
                    rows={3}
                    maxLength={MESSAGE_MAX}
                    placeholder="Сегодня закрыто по техническим причинам"
                    value={draft.message}
                    onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
                    disabled={save.isPending}
                  />
                )}
              </FormField>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/** Computed status from the public GET /status — the same thing the site shows. */
function LiveStatus() {
  const status = useSiteStatus();

  if (status.isPending) {
    return (
      <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (status.isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-red-200 bg-red-50/40 p-4" role="alert">
        <div>
          <div className="text-sm font-medium text-zinc-900">Не удалось получить статус сайта</div>
          <div className="mt-0.5 text-[13px] text-zinc-600">{errorMessage(status.error)}</div>
        </div>
        <Button size="sm" variant="secondary" icon={<RefreshCw />} onClick={() => void status.refetch()}>
          Повторить
        </Button>
      </div>
    );
  }

  const s = status.data;
  const info = venueStatusInfo(s.venue);
  const closed = s.venue.mode === 'temporarily_closed';

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Сейчас на сайте</div>
      <div className="mt-2 flex items-start gap-3">
        <div className="mt-1.5">
          <StatusDot tone={info.tone} pulse={info.pulse} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-zinc-900">{info.label}</div>
          <div className="mt-0.5 text-sm text-zinc-600">{closed ? s.venue.closedMessage || 'Заведение временно закрыто' : s.venue.message || 'Сегодня выходной'}</div>
          {!closed && s.venue.opensAt && s.venue.closesAt && (
            <div className="mt-1 text-[12.5px] tabular-nums text-zinc-400">
              Сегодня {s.venue.opensAt}–{s.venue.closesAt}
            </div>
          )}
        </div>
      </div>
      {s.schedules.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-100 rounded-lg border border-zinc-100 bg-white">
          {s.schedules.map((sc) => (
            <li key={sc.scheduleId} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <Clock className={cn('size-4 shrink-0', sc.isOpen ? 'text-emerald-500' : 'text-zinc-400')} />
                <span className="shrink-0 font-medium text-zinc-800">{sc.name}</span>
                {sc.message && <span className="truncate text-zinc-500">· {sc.message}</span>}
              </div>
              <Badge tone={sc.isOpen ? 'success' : 'neutral'} size="sm">
                {sc.isOpen ? 'Открыто' : 'Закрыто'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {s.serverTime && (
        <div className="mt-3 text-[12px] text-zinc-400">
          Обновлено в {formatServerTime(s.serverTime, s.timezone)}
          {s.timezone ? ` · ${s.timezone}` : ''}
        </div>
      )}
    </div>
  );
}
