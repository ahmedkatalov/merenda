import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MoonStar } from 'lucide-react';
import { isValidTimeOfDay, type Schedule, type ScheduleExceptionInput } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { Button, Dialog, FormField, Input, Switch } from '@/components/ui';
import { useAddException } from '../hooks';
import { clipTime, DEFAULT_CLOSES_AT, DEFAULT_OPENS_AT, formatExceptionDate, isOvernight, weekdayOf } from '../utils';

const schema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Укажите дату'),
    isClosed: z.boolean(),
    opensAt: z.string(),
    closesAt: z.string(),
    note: z.string().trim().max(120, 'Не больше 120 символов'),
  })
  .superRefine((v, ctx) => {
    if (v.isClosed) return;
    if (!isValidTimeOfDay(v.opensAt)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['opensAt'], message: 'Укажите время открытия' });
    if (!isValidTimeOfDay(v.closesAt)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['closesAt'], message: 'Укажите время закрытия' });
  });
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { date: '', isClosed: true, opensAt: DEFAULT_OPENS_AT, closesAt: DEFAULT_CLOSES_AT, note: '' };

/** Add (or update — the server upserts by date) a special date for one schedule. */
export function ExceptionForm({ open, onClose, schedule }: { open: boolean; onClose: () => void; schedule: Schedule }) {
  const add = useAddException();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const { register, control, handleSubmit, reset, watch, setValue, setError, formState } = form;
  const { errors, dirtyFields } = formState;

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const date = watch('date');
  const isClosed = watch('isClosed');
  const opensAt = watch('opensAt');
  const closesAt = watch('closesAt');

  // Prefill the interval from the regular hours of that weekday until the user edits the times.
  useEffect(() => {
    if (!open || !date || dirtyFields.opensAt || dirtyFields.closesAt) return;
    const weekday = weekdayOf(date);
    if (weekday === null) return;
    const day = schedule.hours.find((h) => h.weekday === weekday);
    if (!day || day.isClosed) return;
    setValue('opensAt', clipTime(day.opensAt) || DEFAULT_OPENS_AT);
    setValue('closesAt', clipTime(day.closesAt) || DEFAULT_CLOSES_AT);
  }, [open, date, schedule.hours, dirtyFields.opensAt, dirtyFields.closesAt, setValue]);

  const existing = date ? schedule.exceptions.find((e) => e.date === date) : undefined;
  const overnight = !isClosed && isOvernight(opensAt, closesAt);

  const onSubmit = handleSubmit(async (v) => {
    const body: ScheduleExceptionInput = {
      date: v.date,
      isClosed: v.isClosed,
      opensAt: v.isClosed ? null : v.opensAt,
      closesAt: v.isClosed ? null : v.closesAt,
      note: v.note,
    };
    try {
      await add.mutateAsync({ scheduleId: schedule.id, body });
      onClose();
    } catch (e) {
      if (!applyServerErrors(e, setError)) toast.error(errorMessage(e));
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Особая дата"
      description={`Расписание «${schedule.name}». Особая дата важнее обычных часов.`}
      locked={add.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={add.isPending}>
            Отмена
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()} loading={add.isPending}>
            {existing ? 'Обновить' : 'Добавить'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField
          label="Дата"
          required
          error={errors.date?.message}
          help={existing ? `${formatExceptionDate(existing.date)} уже в списке — запись будет обновлена.` : undefined}
        >
          {(id) => <Input id={id} type="date" className="tabular-nums" invalid={!!errors.date} data-autofocus {...register('date')} />}
        </FormField>

        <div className="rounded-xl border border-zinc-200 px-4 py-2">
          <Controller
            control={control}
            name="isClosed"
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Выходной" description="Не работает весь день." />}
          />
        </div>

        {!isClosed && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Открытие" required error={errors.opensAt?.message}>
              {(id) => <Input id={id} type="time" step={60} className="tabular-nums" invalid={!!errors.opensAt} {...register('opensAt')} />}
            </FormField>
            <FormField label="Закрытие" required error={errors.closesAt?.message}>
              {(id) => <Input id={id} type="time" step={60} className="tabular-nums" invalid={!!errors.closesAt} {...register('closesAt')} />}
            </FormField>
            {overnight && (
              <p className="col-span-2 -mt-1 inline-flex items-center gap-1 text-[12.5px] text-zinc-500">
                <MoonStar className="size-3.5" />
                Закрытие после полуночи — до следующего дня.
              </p>
            )}
          </div>
        )}

        <FormField label="Заметка" help="Например: «8 марта» или «Инвентаризация»." error={errors.note?.message}>
          {(id) => <Input id={id} maxLength={120} placeholder="Праздник" invalid={!!errors.note} {...register('note')} />}
        </FormField>
      </form>
    </Dialog>
  );
}
