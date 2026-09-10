import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Eye, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { buildFontsUrl, getPreset, normalizeTheme, type ThemeSettings } from '@merenda/shared';
import { cn, debounce } from '@/lib/utils';
import { errorMessage } from '@/lib/api';
import { Badge, Button, ErrorState, Skeleton, Tabs } from '@/components/ui';
import { UnsavedGuard } from '@/components/UnsavedGuard';
import { useSaveSetting, useSetting } from '@/features/settings/hooks';
import { PreviewFrame, type PreviewFrameHandle } from '@/features/preview/PreviewFrame';
import { useIsThemeDirty, useThemeDraft } from '../store';
import { PresetsTab } from '../components/PresetsTab';
import { ColorsTab } from '../components/ColorsTab';
import { TypographyTab } from '../components/TypographyTab';
import { ShapeTab } from '../components/ShapeTab';
import { EffectsTab } from '../components/EffectsTab';
import { LayoutTab } from '../components/LayoutTab';

type TabKey = 'presets' | 'colors' | 'typography' | 'shape' | 'effects' | 'layout';
const TABS: { value: TabKey; label: string }[] = [
  { value: 'presets', label: 'Пресеты' },
  { value: 'colors', label: 'Цвета' },
  { value: 'typography', label: 'Шрифты' },
  { value: 'shape', label: 'Форма' },
  { value: 'effects', label: 'Эффекты' },
  { value: 'layout', label: 'Макет' },
];

/** Load the draft's Google Fonts into the admin document so the typography tab previews them. */
function usePreviewFonts(theme: ThemeSettings | null) {
  useEffect(() => {
    if (!theme) return;
    const href = buildFontsUrl(theme);
    let link = document.getElementById('merenda-preview-fonts') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = 'merenda-preview-fonts';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [theme?.typography.headingFont, theme?.typography.bodyFont]); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function AppearancePage() {
  const query = useSetting('theme');
  const save = useSaveSetting('theme', { silent: true });
  const draft = useThemeDraft((s) => s.draft);
  const init = useThemeDraft((s) => s.init);
  const markSaved = useThemeDraft((s) => s.markSaved);
  const reset = useThemeDraft((s) => s.reset);
  const dirty = useIsThemeDirty();
  const [tab, setTab] = useState<TabKey>('presets');
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<PreviewFrameHandle>(null);

  useEffect(() => {
    if (query.data) init(normalizeTheme(query.data));
  }, [query.data, init]);

  usePreviewFonts(draft);

  // Live preview, debounced.
  const postTheme = useRef(debounce((theme: ThemeSettings) => previewRef.current?.post({ type: 'merenda:preview:theme', theme }), 150));
  useEffect(() => {
    if (draft) postTheme.current(draft);
  }, [draft]);
  useEffect(() => {
    const fn = postTheme.current;
    return () => fn.cancel();
  }, []);

  const onSave = async () => {
    if (!draft) return;
    try {
      const saved = await save.mutateAsync(draft);
      markSaved(saved ?? draft);
      toast.success('Тема сохранена');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const onReset = () => {
    reset();
    toast('Изменения отменены', { duration: 1500 });
  };

  const presetName = draft?.preset ? getPreset(draft.preset)?.name : null;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-1 flex-col lg:flex-row">
      <UnsavedGuard when={dirty && !save.isPending} />

      <aside className={cn('flex w-full min-h-0 flex-1 flex-col border-zinc-200 bg-white lg:w-[420px] lg:flex-none lg:border-r', showPreview ? 'hidden lg:flex' : 'flex')}>
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Внешний вид</h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-zinc-500">
              Изменения видны справа сразу.
              {draft && (presetName ? <Badge size="sm">Пресет: {presetName}</Badge> : <Badge size="sm" tone="accent">Своя настройка</Badge>)}
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={<Eye />} className="lg:hidden" onClick={() => setShowPreview(true)}>
            Предпросмотр
          </Button>
        </div>
        <div className="px-4 pt-3 sm:px-5">
          <Tabs<TabKey> variant="pills" size="sm" items={TABS} value={tab} onChange={setTab} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin sm:px-5">
          {query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : !draft ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : (
            <>
              {tab === 'presets' && <PresetsTab draft={draft} />}
              {tab === 'colors' && <ColorsTab draft={draft} />}
              {tab === 'typography' && <TypographyTab draft={draft} />}
              {tab === 'shape' && <ShapeTab draft={draft} />}
              {tab === 'effects' && <EffectsTab draft={draft} />}
              {tab === 'layout' && <LayoutTab draft={draft} />}
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <div className={cn('flex min-w-0 items-center gap-2 text-[12.5px]', dirty ? 'text-amber-700' : 'text-zinc-500')}>
            <span className={cn('size-2 shrink-0 rounded-full', dirty ? 'bg-amber-500' : 'bg-emerald-500')} />
            <span className="truncate">{dirty ? 'Не сохранено' : 'Сохранено'}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" icon={<RotateCcw />} onClick={onReset} disabled={!dirty || save.isPending}>
              Сбросить
            </Button>
            <Button variant="primary" icon={<Save />} onClick={() => void onSave()} loading={save.isPending} disabled={!dirty || !draft}>
              Сохранить
            </Button>
          </div>
        </div>
      </aside>

      <PreviewFrame
        ref={previewRef}
        className={cn(showPreview ? 'flex' : 'hidden lg:flex')}
        toolbarExtra={
          <Button variant="secondary" size="sm" icon={<SlidersHorizontal />} className="lg:hidden" onClick={() => setShowPreview(false)}>
            Настройки
          </Button>
        }
      />
    </div>
  );
}
