import { useMemo, useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import type { Schedule, ScheduleException } from '@merenda/shared';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, ConfirmDialog, EmptyState, IconButton } from '@/components/ui';
import { useRemoveException } from '../hooks';
import { exceptionDateTile, formatExceptionDate, todayISODate } from '../utils';
import { ExceptionForm } from './ExceptionForm';

export function ExceptionsCard({ schedule }: { schedule: Schedule }) {
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ScheduleException | null>(null);
  const remove = useRemoveException();

  const items = useMemo(() => [...schedule.exceptions].sort((a, b) => a.date.localeCompare(b.date)), [schedule.exceptions]);
  const today = todayISODate();

  return (
    <>
      <Card
        title="Особые даты"
        description="Праздники и дни с изменённым графиком. Особая дата важнее обычного расписания."
        padding="none"
        actions={
          <Button variant="secondary" icon={<Plus />} onClick={() => setAdding(true)}>
            Добавить дату
          </Button>
        }
      >
        {items.length === 0 ? (
          <EmptyState
            compact
            icon={<CalendarDays />}
            title="Особых дат нет"
            description="Добавьте праздники или дни с изменённым графиком."
            action={
              <Button variant="primary" icon={<Plus />} onClick={() => setAdding(true)}>
                Добавить дату
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
            {items.map((ex) => (
              <ExceptionRow key={ex.id} exception={ex} past={ex.date < today} onDelete={() => setDeleting(ex)} />
            ))}
          </ul>
        )}
      </Card>

      <ExceptionForm open={adding} onClose={() => setAdding(false)} schedule={schedule} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        title={`Удалить дату «${deleting ? formatExceptionDate(deleting.date) : ''}»?`}
        description="В этот день снова будет действовать обычное расписание."
        confirmLabel="Удалить"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate({ scheduleId: schedule.id, exceptionId: deleting.id }, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}

function ExceptionRow({ exception: ex, past, onDelete }: { exception: ScheduleException; past: boolean; onDelete: () => void }) {
  const tile = exceptionDateTile(ex.date);
  return (
    <li className={cn('flex items-center gap-3 px-5 py-3', past && 'opacity-60')}>
      <div
        className={cn('flex size-10 shrink-0 flex-col items-center justify-center rounded-lg', ex.isClosed ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-50 text-emerald-700')}
        aria-hidden="true"
      >
        <span className="text-[15px] font-semibold leading-none tabular-nums">{tile.day}</span>
        <span className="mt-0.5 text-[10px] uppercase leading-none">{tile.month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn('text-sm font-medium', past ? 'text-zinc-600' : 'text-zinc-900')}>{formatExceptionDate(ex.date)}</span>
          {ex.isClosed ? (
            <Badge tone="neutral" size="sm">
              Выходной
            </Badge>
          ) : (
            <span className="text-sm tabular-nums text-zinc-700">
              {ex.opensAt}–{ex.closesAt}
            </span>
          )}
          {past && (
            <Badge tone="neutral" size="sm" className="text-zinc-500">
              Прошла
            </Badge>
          )}
        </div>
        {ex.note && <div className="mt-0.5 truncate text-[12.5px] text-zinc-500">{ex.note}</div>}
      </div>
      <IconButton label="Удалить дату" className="text-zinc-400 hover:text-red-600" onClick={onDelete}>
        <Trash2 />
      </IconButton>
    </li>
  );
}
