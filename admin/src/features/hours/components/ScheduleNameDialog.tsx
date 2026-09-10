import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { Schedule } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { Button, Dialog, FormField, Input } from '@/components/ui';
import { useCreateSchedule, useRenameSchedule } from '../hooks';

const schema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(60, 'Не больше 60 символов'),
});
type FormValues = z.infer<typeof schema>;

/** Create a custom schedule (`schedule` = null) or rename an existing one. */
export function ScheduleNameDialog({
  open,
  onClose,
  schedule,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onCreated?: (created: Schedule) => void;
}) {
  const create = useCreateSchedule();
  const rename = useRenameSchedule();
  const { register, handleSubmit, reset, setError, formState } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '' } });

  useEffect(() => {
    if (open) reset({ name: schedule?.name ?? '' });
  }, [open, schedule, reset]);

  const onSubmit = handleSubmit(async ({ name }) => {
    try {
      if (schedule) {
        await rename.mutateAsync({ id: schedule.id, body: { name } });
      } else {
        const created = await create.mutateAsync({ name });
        onCreated?.(created);
      }
      onClose();
    } catch (e) {
      if (!applyServerErrors(e, setError)) toast.error(errorMessage(e));
    }
  });

  const pending = create.isPending || rename.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={schedule ? 'Переименовать расписание' : 'Новое расписание'}
      description={schedule ? undefined : 'Отдельные часы для кухни, бара или доставки. Привязать расписание к меню можно в разделе «Меню».'}
      locked={pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Отмена
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()} loading={pending}>
            {schedule ? 'Сохранить' : 'Создать'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FormField label="Название" required error={formState.errors.name?.message}>
          {(id) => <Input id={id} placeholder="Кухня" maxLength={60} invalid={!!formState.errors.name} data-autofocus {...register('name')} />}
        </FormField>
      </form>
    </Dialog>
  );
}
