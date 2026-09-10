import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { slugify, type Menu, type Schedule } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { iconByName, MENU_ICON_SUGGESTIONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Button, Drawer, FormField, Input, Select, Switch, Textarea } from '@/components/ui';
import { useCreateMenu, useUpdateMenu } from '../hooks';

const schema = z.object({
  name: z.string().trim().min(1, 'Введите название').max(80, 'Не больше 80 символов'),
  slug: z.string().trim().max(64).regex(/^[a-z0-9-]*$/, 'Только латиница, цифры и дефис'),
  description: z.string().trim().max(300, 'Не больше 300 символов'),
  icon: z.string().trim().max(40),
  scheduleId: z.string(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function MenuForm({ open, onClose, menu, schedules }: { open: boolean; onClose: () => void; menu: Menu | null; schedules: Schedule[] }) {
  const create = useCreateMenu();
  const update = useUpdateMenu();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', description: '', icon: 'utensils', scheduleId: '', isActive: true },
  });
  const { register, control, handleSubmit, reset, setValue, watch, setError, formState } = form;
  const slugTouched = formState.dirtyFields.slug;

  useEffect(() => {
    if (!open) return;
    reset(
      menu
        ? { name: menu.name, slug: menu.slug, description: menu.description, icon: menu.icon, scheduleId: menu.scheduleId ?? '', isActive: menu.isActive }
        : { name: '', slug: '', description: '', icon: 'utensils', scheduleId: '', isActive: true },
    );
  }, [open, menu, reset]);

  const name = watch('name');
  useEffect(() => {
    if (!menu && !slugTouched) setValue('slug', slugify(name));
  }, [name, menu, slugTouched, setValue]);

  const icon = watch('icon');
  const Icon = iconByName(icon);

  const onSubmit = handleSubmit(async (values) => {
    const body = { ...values, scheduleId: values.scheduleId || null, slug: values.slug || undefined };
    try {
      if (menu) await update.mutateAsync({ id: menu.id, body });
      else await create.mutateAsync(body);
      onClose();
    } catch (e) {
      if (!applyServerErrors(e, setError)) toast.error(errorMessage(e));
    }
  });

  const pending = create.isPending || update.isPending;
  const customSchedules = schedules.filter((s) => s.kind === 'custom');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={menu ? 'Редактировать меню' : 'Новое меню'}
      locked={pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Отмена
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()} loading={pending}>
            {menu ? 'Сохранить' : 'Создать'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField label="Название" required error={formState.errors.name?.message}>
          {(id) => <Input id={id} placeholder="Кухня" invalid={!!formState.errors.name} data-autofocus {...register('name')} />}
        </FormField>
        <FormField label="Адрес (slug)" help="Используется в ссылках на сайте." error={formState.errors.slug?.message}>
          {(id) => <Input id={id} placeholder="kitchen" invalid={!!formState.errors.slug} {...register('slug')} className="font-mono text-[13px]" />}
        </FormField>
        <FormField label="Описание" error={formState.errors.description?.message}>
          {(id) => <Textarea id={id} rows={2} placeholder="Короткое описание для сайта" {...register('description')} />}
        </FormField>
        <FormField label="Иконка" help="Название иконки Lucide, например «coffee»." error={formState.errors.icon?.message}>
          {(id) => (
            <div className="space-y-2">
              <Input id={id} placeholder="utensils" prefix={<Icon />} {...register('icon')} />
              <div className="flex flex-wrap gap-1.5">
                {MENU_ICON_SUGGESTIONS.map((s) => {
                  const S = iconByName(s);
                  return (
                    <button key={s} type="button" title={s} onClick={() => setValue('icon', s, { shouldDirty: true })} className={cn('inline-flex size-9 items-center justify-center rounded-lg border transition-colors', icon === s ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400')}>
                      <S className="size-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </FormField>
        <FormField label="Расписание" help="Когда можно заказывать блюда из этого меню.">
          {(id) => (
            <Select id={id} {...register('scheduleId')}>
              <option value="">Часы заведения</option>
              {customSchedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <div className="rounded-xl border border-zinc-200 px-4 py-2">
          <Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Показывать на сайте" description="Неактивное меню скрыто вместе с категориями." />} />
        </div>
      </form>
    </Drawer>
  );
}
