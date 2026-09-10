import { useEffect } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ExternalLink, MessageCircle, TriangleAlert } from 'lucide-react';
import { buildWhatsappUrl, type OrderSettings } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/forms';
import { cn } from '@/lib/utils';
import { Button, Card, FormField, Input, MoneyInput, Switch, Textarea, Tooltip } from '@/components/ui';
import { UnsavedGuard } from '@/components/UnsavedGuard';
import { useSaveSetting } from '@/features/settings/hooks';
import { orderSettingsSchema, type OrderSettingsFormValues } from '../lib/schema';
import { hasWhatsappNumber, TEST_MESSAGE } from '../lib/buildMessage';
import { MessagePreview } from './MessagePreview';
import { SaveBar } from './SaveBar';

type BoolField = 'enabled' | 'allowDineIn' | 'allowTakeaway' | 'askName' | 'askPhone' | 'askComment' | 'blockWhenClosed';

function SwitchRow({ control, name, label, description, className }: { control: Control<OrderSettingsFormValues>; name: BoolField; label: string; description?: string; className?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <Switch ref={field.ref} checked={field.value} onCheckedChange={field.onChange} label={label} description={description} className={cn('py-3', className)} />}
    />
  );
}

function GroupTitle({ children }: { children: string }) {
  return <h4 className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-zinc-500">{children}</h4>;
}

export function OrderSettingsForm({ initial }: { initial: OrderSettings }) {
  const save = useSaveSetting('orders', { silent: true });
  const form = useForm<OrderSettingsFormValues>({ resolver: zodResolver(orderSettingsSchema), defaultValues: initial });
  const { register, control, handleSubmit, reset, watch, setError, formState } = form;
  const { errors, isDirty } = formState;

  // Follow background refetches without clobbering fields the user is editing.
  useEffect(() => {
    reset(initial, { keepDirtyValues: true });
  }, [initial, reset]);

  const values = watch();
  const canTest = hasWhatsappNumber(values.whatsappNumber);
  const missingNumber = values.enabled && values.whatsappNumber.trim() === '';

  const openTestChat = () => {
    window.open(buildWhatsappUrl(values.whatsappNumber, TEST_MESSAGE), '_blank', 'noopener,noreferrer');
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const saved = await save.mutateAsync(data);
      reset(saved);
      toast.success('Сохранено');
    } catch (e) {
      if (!applyServerErrors(e, setError)) toast.error(errorMessage(e));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <UnsavedGuard when={isDirty} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-5">
          {/* 1. Приём заказов */}
          <Card title="Приём заказов" description="Главный переключатель и номер, на который приходят заказы.">
            <div className="space-y-5">
              <div className="rounded-xl border border-zinc-200 px-4 py-2">
                <SwitchRow control={control} name="enabled" label="Принимать заказы на сайте" description="Когда выключено, кнопки «В корзину» скрыты, меню остаётся видимым." className="py-2" />
              </div>

              <FormField
                label="Номер WhatsApp"
                help="В международном формате, например +49 151 2345678. Пустое поле — заказы сохраняются только в панели."
                error={errors.whatsappNumber?.message}
              >
                {(id) => (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <Input
                      id={id}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+7 999 123-45-67"
                      prefix={<MessageCircle />}
                      invalid={!!errors.whatsappNumber}
                      className="min-w-0 flex-1"
                      {...register('whatsappNumber')}
                    />
                    <Tooltip content={canTest ? 'Откроет чат с тестовым сообщением' : 'Введите номер, чтобы проверить'} className="w-full sm:w-auto">
                      <Button variant="secondary" icon={<ExternalLink />} onClick={openTestChat} disabled={!canTest} className="w-full sm:w-auto">
                        Проверить
                      </Button>
                    </Tooltip>
                  </div>
                )}
              </FormField>

              {missingNumber && (
                <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] leading-snug text-amber-800">
                  <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
                  <span>Без номера заказы не будут отправляться в WhatsApp.</span>
                </div>
              )}
            </div>
          </Card>

          {/* 2. Типы заказа и данные гостя */}
          <Card title="Типы заказа и данные гостя" description="Что гость выбирает и заполняет при оформлении заказа.">
            <div className="space-y-5">
              <section>
                <GroupTitle>Тип заказа</GroupTitle>
                <div className="divide-y divide-zinc-100">
                  <SwitchRow control={control} name="allowDineIn" label="В заведении" description="Гость заказывает за столиком или у стойки." />
                  <SwitchRow control={control} name="allowTakeaway" label="На вынос" description="Заказ собирают с собой." />
                </div>
                {errors.allowTakeaway?.message && (
                  <p role="alert" className="mt-1 text-[13px] text-red-600">
                    {errors.allowTakeaway.message}
                  </p>
                )}
              </section>

              <section>
                <GroupTitle>Данные гостя</GroupTitle>
                <div className="divide-y divide-zinc-100">
                  <SwitchRow control={control} name="askName" label="Спрашивать имя" description="Чтобы обращаться к гостю по имени." />
                  <SwitchRow control={control} name="askPhone" label="Спрашивать телефон" description="Пригодится, если нужно уточнить детали заказа." />
                  <SwitchRow control={control} name="askComment" label="Поле для комментария" description="Пожелания к заказу: без сахара, поострее и т. п." />
                </div>
              </section>
            </div>
          </Card>

          {/* 3. Ограничения */}
          <Card title="Ограничения" description="Когда заказ не будет принят.">
            <div className="space-y-5">
              <FormField label="Минимальная сумма заказа" help="0 — без минимума." error={errors.minOrderMinor?.message}>
                {(id) => (
                  <Controller
                    control={control}
                    name="minOrderMinor"
                    render={({ field }) => (
                      <MoneyInput
                        id={id}
                        ref={field.ref}
                        value={field.value}
                        onChange={(minor) => field.onChange(minor ?? 0)}
                        onBlur={field.onBlur}
                        allowEmpty={false}
                        invalid={!!errors.minOrderMinor}
                        className="sm:max-w-[240px]"
                      />
                    )}
                  />
                )}
              </FormField>

              <div className="rounded-xl border border-zinc-200 px-4 py-2">
                <SwitchRow
                  control={control}
                  name="blockWhenClosed"
                  label="Не принимать заказы, когда заведение закрыто"
                  description="Учитывается статус заведения и расписание меню (например, кухни)."
                  className="py-2"
                />
              </div>
            </div>
          </Card>

          {/* 4. Текст сообщения */}
          <Card title="Текст сообщения" description="Состав заказа и сумма добавляются автоматически.">
            <div className="space-y-5">
              <FormField label="Заголовок сообщения" required help="Первая строка сообщения." error={errors.messageTitle?.message}>
                {(id) => <Input id={id} placeholder="Новый заказ — Меренда" maxLength={120} invalid={!!errors.messageTitle} {...register('messageTitle')} />}
              </FormField>
              <FormField label="Подпись в конце" help="Необязательно. Добавляется последней строкой." error={errors.messageFooter?.message}>
                {(id) => (
                  <Textarea id={id} rows={2} placeholder="Спасибо! Мы свяжемся с вами для подтверждения." maxLength={300} invalid={!!errors.messageFooter} {...register('messageFooter')} />
                )}
              </FormField>
            </div>
          </Card>
        </div>

        <MessagePreview settings={values} className="lg:sticky lg:top-20 lg:self-start" />
      </div>

      <SaveBar dirty={isDirty} saving={save.isPending} onReset={() => reset()} />
    </form>
  );
}
