import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { slugify, type Availability, type ProductInput } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { cn } from '@/lib/utils';
import { Button, Card, ChipInput, ConfirmDialog, ErrorState, FormField, IconButton, Input, MediaField, MoneyInput, PageHeader, Select, Skeleton, Switch, Textarea } from '@/components/ui';
import { UnsavedGuard } from '@/components/UnsavedGuard';
import { useMenus } from '@/features/menus/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useCreateProduct, useDeleteProduct, useProduct, useUpdateProduct } from '../hooks';
import { AvailabilityControl } from '../components/AvailabilityControl';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Введите название').max(120, 'Не больше 120 символов'),
    slug: z.string().trim().max(64, 'Не больше 64 символов').regex(/^[a-z0-9-]*$/, 'Только латиница, цифры и дефис'),
    description: z.string().trim().max(2000, 'Не больше 2000 символов'),
    priceMinor: z.number({ invalid_type_error: 'Введите цену' }).int().min(0, 'Цена не может быть отрицательной'),
    oldPriceMinor: z.number().int().min(0).nullable(),
    menuId: z.string().min(1, 'Выберите меню'),
    categoryId: z.string().min(1, 'Выберите категорию'),
    imageId: z.string().nullable(),
    gifId: z.string().nullable(),
    availability: z.enum(['available', 'unavailable', 'hidden']),
    isPopular: z.boolean(),
    isRecommended: z.boolean(),
    isNew: z.boolean(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20, 'Не больше 20 тегов'),
    attributes: z
      .array(
        z.object({
          label: z.string().trim().min(1, 'Укажите название').max(60),
          value: z.string().trim().min(1, 'Укажите значение').max(120),
        }),
      )
      .max(20, 'Не больше 20 характеристик'),
  })
  .refine((v) => v.oldPriceMinor === null || v.oldPriceMinor === 0 || v.oldPriceMinor > v.priceMinor, {
    path: ['oldPriceMinor'],
    message: 'Старая цена должна быть больше текущей',
  });
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  name: '',
  slug: '',
  description: '',
  priceMinor: 0,
  oldPriceMinor: null,
  menuId: '',
  categoryId: '',
  imageId: null,
  gifId: null,
  availability: 'available',
  isPopular: false,
  isRecommended: false,
  isNew: false,
  tags: [],
  attributes: [],
};

const TAG_SUGGESTIONS = ['Острое', 'Вегетарианское', 'Веган', 'Без глютена', 'Без лактозы', 'Детское', 'Сезонное'];

export default function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const product = useProduct(id);
  const menus = useMenus();
  const allCategories = useCategories(null);
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY, mode: 'onBlur' });
  const { register, control, handleSubmit, reset, setValue, watch, setError, formState, getValues } = form;
  const attributes = useFieldArray({ control, name: 'attributes' });

  // Initialise from the loaded product (menuId derived from its category).
  useEffect(() => {
    if (isNew) {
      reset(EMPTY);
      return;
    }
    if (!product.data || !allCategories.data) return;
    const p = product.data;
    const cat = allCategories.data.find((c) => c.id === p.categoryId);
    reset({
      name: p.name,
      slug: p.slug,
      description: p.description,
      priceMinor: p.priceMinor,
      oldPriceMinor: p.oldPriceMinor,
      menuId: cat?.menuId ?? '',
      categoryId: p.categoryId,
      imageId: p.imageId,
      gifId: p.gifId,
      availability: p.availability,
      isPopular: p.isPopular,
      isRecommended: p.isRecommended,
      isNew: p.isNew,
      tags: p.tags ?? [],
      attributes: p.attributes ?? [],
    });
  }, [isNew, product.data, allCategories.data, reset]);

  // Default menu for a new product.
  useEffect(() => {
    if (isNew && menus.data?.[0] && !getValues('menuId')) setValue('menuId', menus.data[0].id);
  }, [isNew, menus.data, getValues, setValue]);

  const name = watch('name');
  const menuId = watch('menuId');
  const categoryId = watch('categoryId');
  const slugTouched = formState.dirtyFields.slug;
  useEffect(() => {
    if (isNew && !slugTouched) setValue('slug', slugify(name));
  }, [name, isNew, slugTouched, setValue]);

  const categoryOptions = useMemo(() => (allCategories.data ?? []).filter((c) => c.menuId === menuId), [allCategories.data, menuId]);
  useEffect(() => {
    // Reset the category when it no longer belongs to the chosen menu.
    if (categoryId && menuId && !categoryOptions.some((c) => c.id === categoryId)) setValue('categoryId', '', { shouldDirty: true });
  }, [menuId, categoryId, categoryOptions, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const body: ProductInput = {
      categoryId: values.categoryId,
      name: values.name,
      slug: values.slug || undefined,
      description: values.description,
      priceMinor: values.priceMinor,
      oldPriceMinor: values.oldPriceMinor && values.oldPriceMinor > 0 ? values.oldPriceMinor : null,
      imageId: values.imageId,
      gifId: values.gifId,
      availability: values.availability,
      isPopular: values.isPopular,
      isRecommended: values.isRecommended,
      isNew: values.isNew,
      tags: values.tags,
      attributes: values.attributes,
    };
    try {
      if (isNew) {
        const created = await create.mutateAsync(body);
        reset(values);
        navigate(`/products/${created.id}`, { replace: true });
      } else {
        const saved = await update.mutateAsync({ id: id!, body });
        reset({ ...values, slug: saved.slug, name: saved.name });
      }
    } catch (e) {
      if (!applyServerErrors(e, setError)) toast.error(errorMessage(e));
    }
  });

  // ⌘S / Ctrl+S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void onSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSubmit]);

  const pending = create.isPending || update.isPending;
  const dirty = formState.isDirty;
  const loading = !isNew && (product.isPending || allCategories.isPending);

  if (!isNew && product.isError) {
    return (
      <>
        <PageHeader backTo="/products" backLabel="Блюда" title="Блюдо" />
        <ErrorState error={product.error} onRetry={() => void product.refetch()} title="Не удалось загрузить блюдо" />
      </>
    );
  }

  return (
    <>
      <UnsavedGuard when={dirty && !pending} />
      <PageHeader backTo="/products" backLabel="Блюда" title={isNew ? 'Новое блюдо' : product.data?.name || 'Блюдо'} description={isNew ? 'Заполните карточку — блюдо появится на сайте в выбранной категории.' : undefined} />

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="pb-24">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <Card title="Основное">
                <div className="space-y-4">
                  <FormField label="Название" required error={formState.errors.name?.message}>
                    {(fid) => <Input id={fid} placeholder="Капучино" invalid={!!formState.errors.name} data-autofocus={isNew || undefined} {...register('name')} />}
                  </FormField>
                  <FormField label="Адрес (slug)" help="Используется в ссылке на блюдо." error={formState.errors.slug?.message}>
                    {(fid) => <Input id={fid} placeholder="kapuchino" invalid={!!formState.errors.slug} className="font-mono text-[13px]" {...register('slug')} />}
                  </FormField>
                  <FormField label="Описание" error={formState.errors.description?.message}>
                    {(fid) => <Textarea id={fid} rows={4} placeholder="Состав, подача, особенности…" {...register('description')} />}
                  </FormField>
                </div>
              </Card>

              <Card title="Цена">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Цена" required error={formState.errors.priceMinor?.message}>
                    {(fid) => <Controller control={control} name="priceMinor" render={({ field }) => <MoneyInput id={fid} value={field.value} onChange={(v) => field.onChange(v ?? 0)} invalid={!!formState.errors.priceMinor} placeholder="0" />} />}
                  </FormField>
                  <FormField label="Старая цена" help="Показывается зачёркнутой рядом с новой ценой." error={formState.errors.oldPriceMinor?.message}>
                    {(fid) => <Controller control={control} name="oldPriceMinor" render={({ field }) => <MoneyInput id={fid} value={field.value} onChange={field.onChange} allowEmpty invalid={!!formState.errors.oldPriceMinor} placeholder="—" />} />}
                  </FormField>
                </div>
              </Card>

              <Card title="Размещение" description="В каком меню и категории показывать блюдо.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Меню" required error={formState.errors.menuId?.message}>
                    {(fid) => <Select id={fid} placeholder="Выберите меню" invalid={!!formState.errors.menuId} options={(menus.data ?? []).map((m) => ({ value: m.id, label: m.name }))} {...register('menuId')} />}
                  </FormField>
                  <FormField label="Категория" required error={formState.errors.categoryId?.message}>
                    {(fid) => (
                      <Select id={fid} placeholder={menuId ? (categoryOptions.length ? 'Выберите категорию' : 'В этом меню нет категорий') : 'Сначала выберите меню'} invalid={!!formState.errors.categoryId} disabled={!menuId || categoryOptions.length === 0} options={categoryOptions.map((c) => ({ value: c.id, label: c.name }))} {...register('categoryId')} />
                    )}
                  </FormField>
                </div>
              </Card>

              <Card title="Характеристики" description="Вес, объём, калорийность — что угодно в формате «название: значение».">
                <div className="space-y-3">
                  {attributes.fields.length === 0 && <p className="text-sm text-zinc-500">Характеристик пока нет.</p>}
                  {attributes.fields.map((f, i) => {
                    const err = formState.errors.attributes?.[i];
                    return (
                      <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
                        <FormField error={err?.label?.message}>
                          {(fid) => <Input id={fid} placeholder="Вес" invalid={!!err?.label} aria-label="Название характеристики" {...register(`attributes.${i}.label` as const)} />}
                        </FormField>
                        <FormField error={err?.value?.message}>
                          {(fid) => <Input id={fid} placeholder="250 г" invalid={!!err?.value} aria-label="Значение характеристики" {...register(`attributes.${i}.value` as const)} />}
                        </FormField>
                        <IconButton label="Удалить характеристику" className="text-zinc-400 hover:text-red-600" onClick={() => attributes.remove(i)}>
                          <Trash2 />
                        </IconButton>
                      </div>
                    );
                  })}
                  <Button variant="secondary" size="sm" icon={<Plus />} onClick={() => attributes.append({ label: '', value: '' })} disabled={attributes.fields.length >= 20}>
                    Добавить характеристику
                  </Button>
                </div>
              </Card>

              {!isNew && (
                <Card title="Опасная зона" className="border-red-200">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-600">Удаление блюда необратимо. Если хотите временно убрать его с сайта, выберите «Скрыто» в наличии.</p>
                    <Button variant="danger" icon={<Trash2 />} onClick={() => setDeleteOpen(true)}>
                      Удалить блюдо
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-5">
              <Card title="Изображение">
                <div className="space-y-4">
                  <Controller control={control} name="imageId" render={({ field }) => <MediaField value={field.value} media={product.data?.image} onChange={(m) => field.onChange(m ? m.id : null)} accept="image" aspect="video" help="Рекомендуется горизонтальное фото, минимум 800×600." />} />
                  <Controller control={control} name="gifId" render={({ field }) => <MediaField label="GIF-анимация" value={field.value} media={product.data?.gif} onChange={(m) => field.onChange(m ? m.id : null)} accept="gif" aspect="video" size="sm" help="Если задан, показывается вместо фото в карточке." />} />
                </div>
              </Card>

              <Card title="Наличие">
                <Controller control={control} name="availability" render={({ field }) => <AvailabilityControl value={field.value as Availability} onChange={field.onChange} layout="stack" />} />
              </Card>

              <Card title="Метки" padding="sm">
                <div className="divide-y divide-zinc-100 px-1">
                  <Controller control={control} name="isPopular" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Хит" description="Метка «Хит» на карточке." className="py-2.5" />} />
                  <Controller control={control} name="isNew" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Новинка" description="Метка «Новинка» на карточке." className="py-2.5" />} />
                  <Controller control={control} name="isRecommended" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Рекомендуем" description="Попадает в блок «Рекомендуем» на сайте." className="py-2.5" />} />
                </div>
              </Card>

              <Card title="Теги" description="Короткие пометки: острое, веган, без глютена…">
                <FormField error={formState.errors.tags?.message}>
                  {(fid) => <Controller control={control} name="tags" render={({ field }) => <ChipInput id={fid} value={field.value} onChange={field.onChange} suggestions={TAG_SUGGESTIONS} placeholder="Введите тег и нажмите Enter" />} />}
                </FormField>
              </Card>
            </div>
          </div>

          {/* Sticky save bar */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/90 backdrop-blur-md md:left-[68px] lg:left-[248px]">
            <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
              <div className={cn('flex min-w-0 items-center gap-2 text-[13px]', dirty ? 'text-amber-700' : 'text-zinc-500')}>
                <span className={cn('size-2 shrink-0 rounded-full', dirty ? 'bg-amber-500' : 'bg-emerald-500')} />
                <span className="truncate">{dirty ? 'Есть несохранённые изменения' : isNew ? 'Заполните карточку и создайте блюдо' : 'Все изменения сохранены'}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="secondary" onClick={() => reset()} disabled={!dirty || pending} className="hidden sm:inline-flex">
                  Отменить
                </Button>
                <Button type="submit" variant="primary" loading={pending} disabled={!isNew && !dirty}>
                  {isNew ? 'Создать блюдо' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        tone="danger"
        title={`Удалить блюдо «${product.data?.name ?? ''}»?`}
        description="Блюдо исчезнет с сайта. Это действие нельзя отменить."
        confirmLabel="Удалить"
        loading={remove.isPending}
        onConfirm={() => {
          if (!id) return;
          remove.mutate(id, {
            onSuccess: () => {
              reset(getValues());
              setDeleteOpen(false);
              navigate('/products', { replace: true });
            },
          });
        }}
      />
    </>
  );
}
