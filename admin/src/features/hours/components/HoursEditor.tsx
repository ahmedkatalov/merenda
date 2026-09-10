import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Copy, MoonStar } from 'lucide-react';
import { groupScheduleDays, isValidTimeOfDay, WEEKDAY_NAMES_RU, WEEKDAY_SHORT_RU, type Schedule, type ScheduleDay } from '@merenda/shared';
import { cn, deepEqual } from '@/lib/utils';
import { Badge, Button, Card, Input, Switch } from '@/components/ui';
import { useSaveHours } from '../hooks';
import { clipTime, hoursPayload, isOvernight, normalizeHours, todayWeekday, validateDay } from '../utils';

interface HoursEditorProps {
  schedule: Schedule;
  /** Header actions (rename / delete for custom schedules). */
  actions?: ReactNode;
  onDirtyChange?: (dirty: boolean) => void;
}

export function HoursEditor({ schedule, actions, onDirtyChange }: HoursEditorProps) {
  const save = useSaveHours();

  // Server state, normalised. The draft rebases on it whenever the schedule or its hours actually change
  // (not on every refetch — the user must not lose edits because the status was polled).
  const initial = useMemo(() => normalizeHours(schedule.hours), [schedule.hours]);
  const resetKey = `${schedule.id}:${JSON.stringify(initial)}`;
  const [draftState, setDraftState] = useState<{ key: string; days: ScheduleDay[] }>({ key: resetKey, days: initial });
  const draft = draftState.key === resetKey ? draftState.days : initial;
  const setDraft = (update: (prev: ScheduleDay[]) => ScheduleDay[]) =>
    setDraftState((s) => ({ key: resetKey, days: update(s.key === resetKey ? s.days : initial) }));

  const errors = useMemo(() => draft.map(validateDay), [draft]);
  const hasErrors = errors.some(Boolean);
  const dirty = !deepEqual(draft, initial);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const updateDay = (weekday: number, patch: Partial<ScheduleDay>) =>
    setDraft((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));

  const applyMondayToAll = () =>
    setDraft((prev) => {
      const monday = prev[0];
      if (!monday) return prev;
      return prev.map((d) => ({ ...d, isClosed: monday.isClosed, opensAt: monday.opensAt, closesAt: monday.closesAt }));
    });

  const reset = () => setDraftState({ key: resetKey, days: initial });
  const submit = () => {
    if (!dirty || hasErrors) return;
    save.mutate({ id: schedule.id, hours: hoursPayload(draft) });
  };

  const summary = hasErrors
    ? null
    : groupScheduleDays(draft)
        .map((g) => (g.isClosed ? `${g.label} — выходной` : `${g.label} ${g.value}`))
        .join(' · ');
  const today = todayWeekday();

  return (
    <Card
      title="Часы работы"
      description={
        <>
          {schedule.kind === 'venue' ? 'Основные часы заведения.' : `Расписание «${schedule.name}».`}
          {summary && (
            <>
              {' '}
              На сайте: <span className="tabular-nums text-zinc-700">{summary}</span>
            </>
          )}
        </>
      }
      actions={actions}
      padding="none"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className={cn('text-[12.5px]', hasErrors ? 'text-red-600' : 'text-zinc-500')}>
            {hasErrors ? 'Исправьте ошибки, чтобы сохранить.' : dirty ? 'Есть несохранённые изменения.' : 'Изменения применяются на сайте сразу после сохранения.'}
          </p>
          <div className="flex gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
            <Button variant="secondary" onClick={reset} disabled={!dirty || save.isPending}>
              Отменить
            </Button>
            <Button variant="primary" onClick={submit} disabled={!dirty || hasErrors} loading={save.isPending}>
              Сохранить
            </Button>
          </div>
        </div>
      }
    >
      <div className="divide-y divide-zinc-100 border-t border-zinc-100">
        {draft.map((day, i) => (
          <DayRow
            key={day.weekday}
            day={day}
            error={errors[i] ?? null}
            isToday={day.weekday === today}
            disabled={save.isPending}
            onChange={(patch) => updateDay(day.weekday, patch)}
            extra={
              day.weekday === 0 ? (
                <Button size="sm" variant="ghost" icon={<Copy />} onClick={applyMondayToAll} disabled={!!errors[0] || save.isPending} className="-mr-2 text-zinc-600 sm:mr-0">
                  Применить ко всем дням
                </Button>
              ) : undefined
            }
          />
        ))}
      </div>
    </Card>
  );
}

interface DayRowProps {
  day: ScheduleDay;
  error: string | null;
  isToday: boolean;
  disabled: boolean;
  onChange: (patch: Partial<ScheduleDay>) => void;
  extra?: ReactNode;
}

/**
 * Desktop: one grid row `[name | switch | opens — closes | hint]`.
 * Mobile: the day name and the switch form a header, the times go on the next line.
 */
function DayRow({ day, error, isToday, disabled, onChange, extra }: DayRowProps) {
  const opensInvalid = !day.isClosed && !isValidTimeOfDay(day.opensAt);
  const closesInvalid = !day.isClosed && !isValidTimeOfDay(day.closesAt);
  const overnight = !day.isClosed && isOvernight(day.opensAt, day.closesAt);
  const showMeta = !!error || overnight || !!extra;

  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors md:grid-cols-[150px_auto_auto_minmax(0,1fr)] md:py-2.5',
        day.isClosed && 'bg-zinc-50/60',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn('truncate text-sm font-medium', day.isClosed ? 'text-zinc-500' : 'text-zinc-900')}>
          <span className="md:hidden">{WEEKDAY_SHORT_RU[day.weekday]}</span>
          <span className="hidden md:inline">{WEEKDAY_NAMES_RU[day.weekday]}</span>
        </span>
        {isToday && (
          <Badge tone="accent" size="sm">
            сегодня
          </Badge>
        )}
      </div>

      <label className={cn('inline-flex min-h-8 select-none items-center gap-2 justify-self-end md:justify-self-auto', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
        <Switch size="sm" checked={day.isClosed} onCheckedChange={(v) => onChange({ isClosed: v })} disabled={disabled} aria-label="Выходной" />
        <span className="text-[13px] text-zinc-600">Выходной</span>
      </label>

      <div className={cn('col-span-2 flex items-center gap-2 md:col-span-1', day.isClosed && 'opacity-60')}>
        <Input
          type="time"
          step={60}
          aria-label="Открытие"
          className="h-10 min-w-0 flex-1 tabular-nums md:w-[7.5rem] md:flex-none"
          value={day.opensAt}
          onChange={(e) => onChange({ opensAt: clipTime(e.target.value) })}
          disabled={disabled || day.isClosed}
          invalid={opensInvalid}
        />
        <span className="shrink-0 text-zinc-400" aria-hidden="true">
          —
        </span>
        <Input
          type="time"
          step={60}
          aria-label="Закрытие"
          className="h-10 min-w-0 flex-1 tabular-nums md:w-[7.5rem] md:flex-none"
          value={day.closesAt}
          onChange={(e) => onChange({ closesAt: clipTime(e.target.value) })}
          disabled={disabled || day.isClosed}
          invalid={closesInvalid}
        />
      </div>

      {showMeta && (
        <div className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 md:col-span-1">
          {error ? (
            <p className="text-[12.5px] text-red-600" role="alert">
              {error}
            </p>
          ) : overnight ? (
            <span className="inline-flex items-center gap-1 text-[12.5px] text-zinc-500">
              <MoonStar className="size-3.5" />
              до следующего дня
            </span>
          ) : (
            <span />
          )}
          {extra}
        </div>
      )}
    </div>
  );
}
