import { Controller } from 'react-hook-form';
import { z } from 'zod';
import type { ContactSettings, SocialType } from '@merenda/shared';
import { SOCIAL_TYPE_LABELS } from '@/lib/i18n';
import { Card, ErrorState, FormField, Input } from '@/components/ui';
import { isHttpUrl, optionalEmail, optionalUrl } from '../validation';
import { FormSkeleton } from './FormSkeleton';
import { SaveBar } from './SaveBar';
import { MAX_SOCIAL_LINKS, SocialLinksField } from './SocialLinksField';
import { useSettingsForm, type SettingsFormProps } from './useSettingsForm';

const SOCIAL_TYPES = Object.keys(SOCIAL_TYPE_LABELS) as [SocialType, ...SocialType[]];

const socialLinkSchema = z.object({
  id: z.string().min(1),
  type: z.enum(SOCIAL_TYPES),
  label: z.string().trim().max(40, 'Не больше 40 символов'),
  url: z.string().trim().min(1, 'Введите ссылку').refine(isHttpUrl, 'Введите корректную ссылку, начинающуюся с https://'),
});

const schema = z.object({
  phone: z.string().trim().max(32, 'Не больше 32 символов'),
  email: optionalEmail,
  address: z.string().trim().max(200, 'Не больше 200 символов'),
  addressNote: z.string().trim().max(120, 'Не больше 120 символов'),
  mapUrl: optionalUrl(),
  mapEmbedUrl: optionalUrl(),
  social: z.array(socialLinkSchema).max(MAX_SOCIAL_LINKS, `Не больше ${MAX_SOCIAL_LINKS} ссылок`),
});
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = { phone: '', email: '', address: '', addressNote: '', mapUrl: '', mapEmbedUrl: '', social: [] };

function toForm(data: ContactSettings): FormValues {
  return {
    phone: data.phone ?? '',
    email: data.email ?? '',
    address: data.address ?? '',
    addressNote: data.addressNote ?? '',
    mapUrl: data.mapUrl ?? '',
    mapEmbedUrl: data.mapEmbedUrl ?? '',
    // Keep ids stable so drag-and-drop and per-row errors stay attached to the same row.
    social: (data.social ?? []).map((l) => ({ id: l.id, type: l.type, label: l.label ?? '', url: l.url ?? '' })),
  };
}

function toPayload(v: FormValues): ContactSettings {
  return {
    phone: v.phone,
    email: v.email,
    address: v.address,
    addressNote: v.addressNote,
    mapUrl: v.mapUrl,
    mapEmbedUrl: v.mapEmbedUrl,
    social: v.social.map((l) => ({ id: l.id, type: l.type, label: l.label, url: l.url })),
  };
}

export function ContactsForm({ onDirtyChange }: SettingsFormProps) {
  const { query, form, submit, cancel, dirty, saving } = useSettingsForm({ key: 'contacts', schema, defaults: DEFAULTS, toForm, toPayload, onDirtyChange });
  const { register, control, formState } = form;
  const errors = formState.errors;

  if (query.isPending) return <FormSkeleton cards={[2, 4, 2]} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const rowError = (i: number, f: 'label' | 'url') => errors.social?.[i]?.[f]?.message;

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-4">
        <Card title="Связь" description="Показываются в блоке «Контакты» и в подвале сайта.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Телефон" error={errors.phone?.message}>
              {(id) => <Input id={id} type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 999 123-45-67" invalid={!!errors.phone} {...register('phone')} />}
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              {(id) => <Input id={id} type="email" inputMode="email" autoComplete="email" placeholder="hello@merenda.ru" invalid={!!errors.email} {...register('email')} />}
            </FormField>
          </div>
        </Card>

        <Card title="Адрес" description="Адрес и карта в блоке «Контакты».">
          <div className="space-y-4">
            <FormField label="Адрес" error={errors.address?.message}>
              {(id) => <Input id={id} placeholder="ул. Пушкина, 10" autoComplete="street-address" invalid={!!errors.address} {...register('address')} />}
            </FormField>
            <FormField label="Как найти" help="Например: вход со двора, 2 этаж." error={errors.addressNote?.message}>
              {(id) => <Input id={id} placeholder="Вход со двора" invalid={!!errors.addressNote} {...register('addressNote')} />}
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Ссылка на карту" help="Ссылка «Поделиться» из Яндекс Карт или Google Maps." error={errors.mapUrl?.message}>
                {(id) => <Input id={id} type="url" inputMode="url" autoComplete="off" placeholder="https://yandex.ru/maps/-/…" invalid={!!errors.mapUrl} {...register('mapUrl')} />}
              </FormField>
              <FormField label="Встраиваемая карта" help="Ссылка для встраивания карты (iframe src)." error={errors.mapEmbedUrl?.message}>
                {(id) => <Input id={id} type="url" inputMode="url" autoComplete="off" placeholder="https://yandex.ru/map-widget/v1/…" invalid={!!errors.mapEmbedUrl} {...register('mapEmbedUrl')} />}
              </FormField>
            </div>
          </div>
        </Card>

        <Card title="Соцсети" description="Ссылки в подвале и в блоке «Соцсети». Перетаскивайте, чтобы изменить порядок.">
          <Controller
            control={control}
            name="social"
            render={({ field, fieldState }) => (
              <SocialLinksField
                value={field.value}
                onChange={field.onChange}
                disabled={saving}
                error={fieldState.error?.root?.message ?? (Array.isArray(fieldState.error) ? undefined : fieldState.error?.message)}
                errors={field.value.map((_, i) => ({ label: rowError(i, 'label'), url: rowError(i, 'url') }))}
              />
            )}
          />
        </Card>
      </div>

      <SaveBar dirty={dirty} saving={saving} onReset={cancel} />
    </form>
  );
}
