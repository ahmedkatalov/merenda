import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { slugify, type Category, type Menu } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { Button, Drawer, FormField, Input, MediaField, Select, Switch, Textarea } from '@/components/ui';
import { useCreateCategory, useUpdateCategory } from '../hooks';

const schema = z.object({
  menuId: z.string().min(1, 'Выберите меню'),
  name: z.string().trim().min(1, 'Введите название').max(80, 'Не больше 80 символов'),
  slug: z.string().trim().max(64).regex(/^[a-z0-9-]*$/, 'Только латиница, цифры и дефис'),
  description: z.string().trim().max(300, 'Не больше 300 символов'),
  imageId: z.string().nullable(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function CategoryForm({ open, onClose, category, menus, menuId }: { open: boolean; onClose: () => void; category: Category | null; menus: Menu[]; menuId: string }) {
  const create = useCreateCategory();
  const update = useUpdateCategory(menuId);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { menuId, name: '', slug: '', description: '', imageId: null, isActive: true } });
  const { register, control, handleSubmit, reset, setValue, watch, setError, formState } = form;

  useEffect(() => {
    if (!open) return;
    reset(
      category
        ? { menuId: category.menuId, name: category.name, slug: category.slug, description: category.description, imageId: category.imageId, isActive: category.isActive }
        : { menuId, name: '', slug: '', description: '', imageId: null, isActive: true },
    );
  }, [open, category, menuId, reset]);

  const name = watch('name');
  useEffect(() => {
    if (!category && !formState.dirtyFields.slug) setValue('slug', slugify(name));
  }, [name, category, formState.dirtyFields.slug, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const body = { ...values, slug: values.slug || undefined };
    try {
      if (category) await update.mutateAsync({ id: category.id, body });
      else await create.mutateAsync(body);
      onClose();
    } catch (e) {
      if (!applyServerErrors(e, setError)) toast.error(errorMessage(e));
    }
  });
  const pending = create.isPending || update.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={category ? 'Редактировать категорию' : 'Новая категория'}
      locked={pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Отмена
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()} loading={pending}>
            {category ? 'Сохранить' : 'Создать'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField label="Меню" required error={formState.errors.menuId?.message}>
          {(id) => <Select id={id} options={menus.map((m) => ({ value: m.id, label: m.name }))} {...register('menuId')} />}
        </FormField>
        <FormField label="Название" required error={formState.errors.name?.message}>
          {(id) => <Input id={id} placeholder="Завтраки" invalid={!!formState.errors.name} data-autofocus {...register('name')} />}
        </FormField>
        <FormField label="Адрес (slug)" error={formState.errors.slug?.message}>
          {(id) => <Input id={id} placeholder="zavtraki" invalid={!!formState.errors.slug} className="font-mono text-[13px]" {...register('slug')} />}
        </FormField>
        <FormField label="Описание" error={formState.errors.description?.message}>
          {(id) => <Textarea id={id} rows={2} {...register('description')} />}
        </FormField>
        <Controller control={control} name="imageId" render={({ field }) => <MediaField label="Изображение" value={field.value} media={category?.image} onChange={(m) => field.onChange(m ? m.id : null)} aspect="video" />} />
        <div className="rounded-xl border border-zinc-200 px-4 py-2">
          <Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Показывать на сайте" />} />
        </div>
      </form>
    </Drawer>
  );
}
