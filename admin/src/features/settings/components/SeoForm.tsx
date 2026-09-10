import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { EyeOff, Globe } from 'lucide-react';
import type { SeoSettings } from '@merenda/shared';
import { SITE_URL } from '@/lib/env';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { useMediaById, useMediaCache } from '@/features/media/cache';
import { Card, ErrorState, FormField, Input, MediaField, Switch, Textarea } from '@/components/ui';
import { useSetting } from '../hooks';
import { optionalUrl } from '../validation';
import { FormSkeleton } from './FormSkeleton';
import { SaveBar } from './SaveBar';
import { useSettingsForm, type SettingsFormProps } from './useSettingsForm';

const TITLE_MAX = 70;
const TITLE_WARN = 60;
const DESC_MAX = 160;
const DESC_WARN = 150;

const schema = z.object({
  title: z.string().trim().max(TITLE_MAX, `Не больше ${TITLE_MAX} символов`),
  description: z.string().trim().max(DESC_MAX, `Не больше ${DESC_MAX} символов`),
  keywords: z.string().trim().max(500, 'Не больше 500 символов'),
  ogImageId: z.string().nullable(),
  canonicalUrl: optionalUrl(),
  robotsIndex: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = { title: '', description: '', keywords: '', ogImageId: null, canonicalUrl: '', robotsIndex: true };

function toForm(data: SeoSettings): FormValues {
  return {
    title: data.title ?? '',
    description: data.description ?? '',
    keywords: data.keywords ?? '',
    ogImageId: data.ogImageId ?? null,
    canonicalUrl: data.canonicalUrl ?? '',
    robotsIndex: data.robotsIndex ?? true,
  };
}

function toPayload(v: FormValues): SeoSettings {
  return { title: v.title, description: v.description, keywords: v.keywords, ogImageId: v.ogImageId, canonicalUrl: v.canonicalUrl, robotsIndex: v.robotsIndex };
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function CounterLabel({ text, count, max, warnAt }: { text: string; count: number; max: number; warnAt: number }) {
  const tone = count > max ? 'text-red-600' : count > warnAt ? 'text-amber-600' : 'text-zinc-400';
  return (
    <span className="flex items-center justify-between gap-3">
      <span>{text}</span>
      <span className={cn('text-[12px] font-normal tabular-nums', tone)} aria-live="polite">
        {count} / {max}
      </span>
    </span>
  );
}

function toDisplayUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const path = u.pathname.split('/').filter(Boolean);
    return [u.host, ...path].join(' › ');
  } catch {
    return raw.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function GooglePreview({ title, description, canonicalUrl }: { title: string; description: string; canonicalUrl: string }) {
  const business = useSetting('business');
  const siteName = business.data?.name?.trim() || 'Меренда';
  const faviconId = business.data?.faviconId ?? null;
  const favicon = useMediaById(faviconId);
  const warm = useMediaCache((s) => s.warm);
  const warmed = useMediaCache((s) => s.warmed);
  useEffect(() => {
    if (faviconId && !favicon && !warmed) void warm();
  }, [faviconId, favicon, warmed, warm]);

  const shownTitle = title.trim() || siteName;
  const shownDescription = truncate(description.trim(), DESC_MAX);

  return (
    <div className="max-w-[600px] rounded-xl border border-zinc-200 bg-white px-4 py-3.5 font-[Arial,sans-serif]">
      <div className="flex items-center gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
          {favicon ? <img src={mediaUrl(favicon.thumbUrl)} alt="" className="size-full object-cover" /> : <Globe className="size-3.5 text-zinc-400" aria-hidden="true" />}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[14px] text-zinc-800">{siteName}</div>
          <div className="truncate text-[12px] text-zinc-500">{toDisplayUrl(canonicalUrl.trim() || SITE_URL)}</div>
        </div>
      </div>
      <div className="mt-2 truncate text-[18px] leading-snug text-[#1a0dab]">{shownTitle}</div>
      {shownDescription ? (
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-zinc-600">{shownDescription}</p>
      ) : (
        <p className="mt-1 text-[13px] italic leading-snug text-zinc-400">Добавьте описание — оно появится здесь.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

export function SeoForm({ onDirtyChange }: SettingsFormProps) {
  const { query, form, submit, cancel, dirty, saving } = useSettingsForm({ key: 'seo', schema, defaults: DEFAULTS, toForm, toPayload, onDirtyChange });
  const { register, control, watch, formState } = form;
  const errors = formState.errors;

  const title = watch('title');
  const description = watch('description');
  const canonicalUrl = watch('canonicalUrl');
  const robotsIndex = watch('robotsIndex');

  if (query.isPending) return <FormSkeleton cards={[4, 1, 1]} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  return (
    <form onSubmit={submit} noValidate>
      <div className="space-y-4">
        <Card title="Поисковая выдача" description="Заголовок и описание, которые показывают Google и Яндекс.">
          <div className="space-y-4">
            <FormField label={<CounterLabel text="Заголовок" count={title.length} max={TITLE_MAX} warnAt={TITLE_WARN} />} error={errors.title?.message}>
              {(id) => <Input id={id} placeholder="Меренда — кафе-кондитерская" invalid={!!errors.title} {...register('title')} />}
            </FormField>
            <FormField label={<CounterLabel text="Описание" count={description.length} max={DESC_MAX} warnAt={DESC_WARN} />} error={errors.description?.message}>
              {(id) => <Textarea id={id} rows={3} placeholder="Свежая выпечка, кофе и десерты. Заказ на вынос через WhatsApp." invalid={!!errors.description} {...register('description')} />}
            </FormField>
            <FormField label="Ключевые слова" help="Через запятую." error={errors.keywords?.message}>
              {(id) => <Input id={id} placeholder="кафе, кондитерская, десерты" invalid={!!errors.keywords} {...register('keywords')} />}
            </FormField>
            <FormField label="Канонический адрес" help="Основной адрес сайта без страниц и параметров." error={errors.canonicalUrl?.message}>
              {(id) => <Input id={id} type="url" inputMode="url" autoComplete="off" placeholder={SITE_URL} invalid={!!errors.canonicalUrl} {...register('canonicalUrl')} />}
            </FormField>
            <div className="rounded-xl border border-zinc-200 px-4 py-2">
              <Controller
                control={control}
                name="robotsIndex"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Разрешить индексацию" description="Выключите, пока сайт не готов к публикации." />}
              />
              {!robotsIndex && (
                <div className="mb-2 mt-1 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800" role="status">
                  <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  Сайт скрыт от поисковых систем.
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Изображение для соцсетей">
          <div className="max-w-sm">
            <Controller
              control={control}
              name="ogImageId"
              render={({ field }) => (
                <MediaField value={field.value} onChange={(m) => field.onChange(m ? m.id : null)} accept="image" aspect="video" help="Показывается при отправке ссылки в мессенджерах. Рекомендуется 1200×630." />
              )}
            />
            {errors.ogImageId?.message && (
              <p className="mt-1.5 text-[13px] text-red-600" role="alert">
                {errors.ogImageId.message}
              </p>
            )}
          </div>
        </Card>

        <Card title="Предпросмотр в Google" description="Примерно так сайт будет выглядеть в результатах поиска.">
          <GooglePreview title={title} description={description} canonicalUrl={canonicalUrl} />
        </Card>
      </div>

      <SaveBar dirty={dirty} saving={saving} onReset={cancel} />
    </form>
  );
}
