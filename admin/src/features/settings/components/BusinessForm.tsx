import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import type { BusinessSettings } from '@merenda/shared';
import { Card, ErrorState, FormField, Input, MediaField, Select, Textarea } from '@/components/ui';
import { CUSTOM_TIMEZONE, KNOWN_TIMEZONES, TIMEZONE_GROUPS, isValidTimeZone, timeInZone } from '../timezones';
import { FormSkeleton } from './FormSkeleton';
import { SaveBar } from './SaveBar';
import { useSettingsForm, type SettingsFormProps } from './useSettingsForm';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Введите название').max(80, 'Не больше 80 символов'),
    tagline: z.string().trim().max(120, 'Не больше 120 символов'),
    description: z.string().trim().max(600, 'Не больше 600 символов'),
    logoId: z.string().nullable(),
    faviconId: z.string().nullable(),
    currency: z.object({
      code: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Три латинские буквы, например RUB'),
      symbol: z.string().trim().min(1, 'Укажите символ').max(3, 'Не больше 3 символов'),
      decimals: z.enum(['0', '2']),
    }),
    timezone: z.string().min(1, 'Выберите часовой пояс'),
    timezoneCustom: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (v.timezone !== CUSTOM_TIMEZONE) return;
    if (!v.timezoneCustom) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['timezoneCustom'], message: 'Введите часовой пояс, например Europe/Moscow' });
    } else if (!isValidTimeZone(v.timezoneCustom)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['timezoneCustom'], message: 'Неизвестный часовой пояс' });
    }
  });
type FormValues = z.infer<typeof schema>;

const DEFAULT_TIMEZONE = 'Europe/Moscow';

const DEFAULTS: FormValues = {
  name: '',
  tagline: '',
  description: '',
  logoId: null,
  faviconId: null,
  currency: { code: 'RUB', symbol: '₽', decimals: '0' },
  timezone: DEFAULT_TIMEZONE,
  timezoneCustom: '',
};

const DECIMALS_OPTIONS = [
  { value: '0', label: 'Без копеек (350 ₽)' },
  { value: '2', label: 'С копейками (350,00 ₽)' },
];

function toForm(data: BusinessSettings): FormValues {
  const tz = data.timezone ?? '';
  const known = KNOWN_TIMEZONES.has(tz);
  return {
    name: data.name ?? '',
    tagline: data.tagline ?? '',
    description: data.description ?? '',
    logoId: data.logoId ?? null,
    faviconId: data.faviconId ?? null,
    currency: {
      code: data.currency?.code ?? 'RUB',
      symbol: data.currency?.symbol ?? '₽',
      decimals: data.currency?.decimals === 2 ? '2' : '0',
    },
    timezone: known ? tz : tz ? CUSTOM_TIMEZONE : DEFAULT_TIMEZONE,
    timezoneCustom: known ? '' : tz,
  };
}

function toPayload(v: FormValues): BusinessSettings {
  return {
    name: v.name,
    tagline: v.tagline,
    description: v.description,
    logoId: v.logoId,
    faviconId: v.faviconId,
    currency: { code: v.currency.code, symbol: v.currency.symbol, decimals: Number(v.currency.decimals) },
    timezone: v.timezone === CUSTOM_TIMEZONE ? v.timezoneCustom : v.timezone,
  };
}

function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function formatPriceExample(symbol: string, decimals: string): string {
  const d = decimals === '2' ? 2 : 0;
  return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }).format(1250)} ${symbol || '₽'}`.trim();
}

export function BusinessForm({ onDirtyChange }: SettingsFormProps) {
  const { query, form, submit, cancel, dirty, saving } = useSettingsForm({ key: 'business', schema, defaults: DEFAULTS, toForm, toPayload, onDirtyChange });
  const { register, control, watch, formState } = form;
  const errors = formState.errors;

  const timezone = watch('timezone');
  const timezoneCustom = watch('timezoneCustom');
  const symbol = watch('currency.symbol');
  const decimals = watch('currency.decimals');
  const now = useNow();

  if (query.isPending) return <FormSkeleton cards={[3, 2, 3, 1]} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const isCustom = timezone === CUSTOM_TIMEZONE;
  const resolvedTz = isCustom ? timezoneCustom.trim() : timezone;
  const localTime = resolvedTz && isValidTimeZone(resolvedTz) ? timeInZone(resolvedTz, now) : null;
  const timeHelp = localTime ? `Сейчас там ${localTime}` : 'Влияет на расписание и статус «Открыто / Закрыто».';

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-4">
        <Card title="Основное" description="Как заведение называется на сайте и в заголовке вкладки.">
          <div className="space-y-4">
            <FormField label="Название" required error={errors.name?.message}>
              {(id) => <Input id={id} placeholder="Меренда" maxLength={80} invalid={!!errors.name} autoComplete="organization" {...register('name')} />}
            </FormField>
            <FormField label="Слоган" help="Короткий слоган под названием." error={errors.tagline?.message}>
              {(id) => <Input id={id} placeholder="Кафе-кондитерская в центре города" maxLength={120} invalid={!!errors.tagline} {...register('tagline')} />}
            </FormField>
            <FormField label="Описание" error={errors.description?.message}>
              {(id) => <Textarea id={id} rows={3} placeholder="Пара предложений о заведении для блока «О нас»." invalid={!!errors.description} {...register('description')} />}
            </FormField>
          </div>
        </Card>

        <Card title="Логотип и иконка" description="Логотип показывается в шапке сайта, favicon — во вкладке браузера.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Controller
                control={control}
                name="logoId"
                render={({ field }) => <MediaField label="Логотип" value={field.value} onChange={(m) => field.onChange(m ? m.id : null)} accept="image" aspect="square" size="sm" help="PNG или SVG-подобный PNG с прозрачным фоном." />}
              />
              {errors.logoId?.message && (
                <p className="mt-1.5 text-[13px] text-red-600" role="alert">
                  {errors.logoId.message}
                </p>
              )}
            </div>
            <div>
              <Controller
                control={control}
                name="faviconId"
                render={({ field }) => <MediaField label="Favicon" value={field.value} onChange={(m) => field.onChange(m ? m.id : null)} accept="image" aspect="square" size="sm" help="Квадратное изображение, минимум 64×64." />}
              />
              {errors.faviconId?.message && (
                <p className="mt-1.5 text-[13px] text-red-600" role="alert">
                  {errors.faviconId.message}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card
          title="Валюта"
          description="Как показывать цены на сайте и в сообщениях WhatsApp."
          footer={
            <p className="text-[13px] text-zinc-600">
              Пример цены: <span className="font-semibold tabular-nums text-zinc-900">{formatPriceExample(symbol, decimals)}</span>
            </p>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Код" help="ISO 4217, например RUB." error={errors.currency?.code?.message}>
              {(id) => (
                <Input
                  id={id}
                  placeholder="RUB"
                  maxLength={3}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono uppercase"
                  invalid={!!errors.currency?.code}
                  {...register('currency.code', { setValueAs: (v: unknown) => String(v ?? '').toUpperCase() })}
                />
              )}
            </FormField>
            <FormField label="Символ" help="Например ₽, $ или €." error={errors.currency?.symbol?.message}>
              {(id) => <Input id={id} placeholder="₽" maxLength={3} autoComplete="off" invalid={!!errors.currency?.symbol} {...register('currency.symbol')} />}
            </FormField>
            <FormField label="Копейки" error={errors.currency?.decimals?.message}>
              {(id) => <Select id={id} options={DECIMALS_OPTIONS} invalid={!!errors.currency?.decimals} {...register('currency.decimals')} />}
            </FormField>
          </div>
        </Card>

        <Card title="Часовой пояс" description="Влияет на расписание работы и статус «Открыто / Закрыто».">
          <div className="space-y-4">
            <FormField label="Часовой пояс" help={timeHelp} error={errors.timezone?.message}>
              {(id) => (
                <Select id={id} groups={TIMEZONE_GROUPS} invalid={!!errors.timezone} {...register('timezone')}>
                  <option value={CUSTOM_TIMEZONE}>Другой…</option>
                </Select>
              )}
            </FormField>
            {isCustom && (
              <FormField label="Идентификатор IANA" help="Например Europe/Lisbon или America/New_York." error={errors.timezoneCustom?.message}>
                {(id) => (
                  <Input
                    id={id}
                    placeholder="Europe/Moscow"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="font-mono text-[13px]"
                    invalid={!!errors.timezoneCustom}
                    {...register('timezoneCustom')}
                  />
                )}
              </FormField>
            )}
          </div>
        </Card>
      </div>

      <SaveBar dirty={dirty} saving={saving} onReset={cancel} />
    </form>
  );
}
