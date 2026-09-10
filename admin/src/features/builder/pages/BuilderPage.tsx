import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, LayoutTemplate, Lock, Plus, Save, Settings2, SlidersHorizontal, Trash2 } from 'lucide-react';
import {
  ADDABLE_SECTION_TYPES,
  SECTION_DEFINITIONS,
  getSectionSettings,
  sectionDefaults,
  type Media,
  type PageSection,
  type SectionType,
  type UUID,
} from '@merenda/shared';
import { cn, debounce } from '@/lib/utils';
import { iconByName } from '@/lib/icons';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  Drawer,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Skeleton,
  SortableList,
  Switch,
} from '@/components/ui';
import { useMediaCache } from '@/features/media/cache';
import { PreviewFrame, type PreviewFrameHandle } from '@/features/preview/PreviewFrame';
import { SectionSettingsForm } from '../components/SectionSettingsForm';
import { collectIds, type SettingsRecord } from '../components/fieldUtils';
import { sortSections, useCreateSection, useDeleteSection, useReorderSections, useSections, useUpdateSection } from '../hooks';

function SectionIcon({ type }: { type: SectionType }) {
  const Cmp = iconByName(SECTION_DEFINITIONS[type].icon, LayoutTemplate);
  return <Cmp className="size-4" />;
}

/** Row in the sortable section list. */
function SectionRow({
  section,
  handle,
  isDragging,
  onToggle,
  onConfigure,
  onDelete,
  onFocus,
}: {
  section: PageSection;
  handle: React.ReactNode;
  isDragging: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigure: () => void;
  onDelete: () => void;
  onFocus: () => void;
}) {
  const def = SECTION_DEFINITIONS[section.type];
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-2 transition-shadow',
        isDragging && 'shadow-pop ring-1 ring-zinc-300',
        !section.isEnabled && 'opacity-70',
      )}
    >
      {section.isLocked ? (
        <span className="inline-flex size-9 shrink-0 items-center justify-center text-zinc-300" title="Закреплённый блок">
          <Lock className="size-4" />
        </span>
      ) : (
        handle
      )}
      <button
        type="button"
        onClick={onFocus}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 text-left focus-ring"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
          <SectionIcon type={section.type} />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-zinc-900">{section.title || def.label}</span>
            {section.isLocked && <Badge size="sm">Закреплён</Badge>}
          </span>
          <span className="block truncate text-[12px] text-zinc-400">{def.label}</span>
        </span>
      </button>
      <Switch
        checked={section.isEnabled}
        onCheckedChange={onToggle}
        size="sm"
        aria-label={section.isEnabled ? 'Скрыть блок' : 'Показать блок'}
      />
      <IconButton label="Настроить" size="sm" onClick={onConfigure}>
        <Settings2 />
      </IconButton>
      {!section.isLocked && (
        <IconButton label="Удалить" size="sm" className="text-zinc-400 hover:text-red-600" onClick={onDelete}>
          <Trash2 />
        </IconButton>
      )}
    </div>
  );
}

function AddSectionDialog({
  open,
  onClose,
  present,
  onAdd,
  adding,
}: {
  open: boolean;
  onClose: () => void;
  present: Set<SectionType>;
  onAdd: (type: SectionType) => void;
  adding: boolean;
}) {
  const available = ADDABLE_SECTION_TYPES.filter((type) => {
    const def = SECTION_DEFINITIONS[type];
    return !(def.unique && present.has(type));
  });
  return (
    <Dialog open={open} onClose={onClose} title="Добавить блок" description="Выберите блок для главной страницы." size="lg">
      {available.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">Все доступные блоки уже добавлены.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {available.map((type) => {
            const def = SECTION_DEFINITIONS[type];
            const Icon = iconByName(def.icon, LayoutTemplate);
            return (
              <button
                key={type}
                type="button"
                disabled={adding}
                onClick={() => onAdd(type)}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-ring disabled:opacity-60"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-zinc-900">{def.label}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-zinc-500">{def.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}

export default function BuilderPage() {
  const query = useSections();
  const create = useCreateSection();
  const update = useUpdateSection();
  const remove = useDeleteSection();
  const reorder = useReorderSections();

  const [showPreview, setShowPreview] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<UUID | null>(null);
  const [deleteId, setDeleteId] = useState<UUID | null>(null);
  const previewRef = useRef<PreviewFrameHandle>(null);

  const sections = query.data ?? [];
  const editing = editId ? sections.find((s) => s.id === editId) ?? null : null;

  // Local draft for the section being edited (title + settings), saved explicitly.
  const [draft, setDraft] = useState<{ title: string; settings: SettingsRecord } | null>(null);
  useEffect(() => {
    if (editing) setDraft({ title: editing.title, settings: getSectionSettings(editing) as unknown as SettingsRecord });
    else setDraft(null);
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the preview `media` map from ids referenced across sections, using the cache.
  const mediaCache = useMediaCache((s) => s.byId);
  useEffect(() => {
    void useMediaCache.getState().warm();
  }, []);

  const postSections = useRef(
    debounce((list: PageSection[], media: Record<UUID, Media>) => {
      previewRef.current?.post({ type: 'merenda:preview:sections', sections: list, media });
    }, 150),
  );
  useEffect(() => {
    const fn = postSections.current;
    return () => fn.cancel();
  }, []);

  // The list the site should render: server sections with the open draft merged in live.
  const previewList = useMemo<PageSection[]>(() => {
    if (!editing || !draft) return sections;
    return sortSections(sections.map((s) => (s.id === editing.id ? { ...s, title: draft.title, settings: draft.settings } : s)));
  }, [sections, editing, draft]);

  const previewMedia = useMemo<Record<UUID, Media>>(() => {
    const ids = new Set<string>();
    for (const s of previewList) collectIds(s.settings, ids);
    const map: Record<UUID, Media> = {};
    for (const id of ids) {
      const m = mediaCache[id];
      if (m) map[id] = m;
    }
    return map;
  }, [previewList, mediaCache]);

  useEffect(() => {
    if (previewList.length) postSections.current(previewList, previewMedia);
  }, [previewList, previewMedia]);

  const present = useMemo(() => new Set(sections.map((s) => s.type)), [sections]);
  const dirty = !!editing && !!draft && (draft.title !== editing.title || JSON.stringify(draft.settings) !== JSON.stringify(getSectionSettings(editing) as unknown as SettingsRecord));

  const onReorder = (next: PageSection[]) => {
    // header stays first, footer stays last regardless of drop position.
    const ordered = sortSections(next);
    reorder.mutate(ordered.map((s) => s.id));
  };

  const onAdd = async (type: SectionType) => {
    try {
      await create.mutateAsync({ type, settings: sectionDefaults(type) as unknown as Record<string, unknown> });
      setAddOpen(false);
    } catch {
      /* toast handled in hook */
    }
  };

  const onToggle = (section: PageSection, enabled: boolean) => update.mutate({ id: section.id, body: { isEnabled: enabled } });

  const onSaveDraft = async () => {
    if (!editing || !draft) return;
    try {
      await update.mutateAsync({ id: editing.id, body: { title: draft.title, settings: draft.settings } });
      setEditId(null);
    } catch {
      /* toast handled in hook */
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      if (editId === deleteId) setEditId(null);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-1 flex-col lg:flex-row">
      <aside
        className={cn(
          'flex w-full min-h-0 flex-1 flex-col border-zinc-200 bg-white lg:w-[440px] lg:flex-none lg:border-r',
          showPreview ? 'hidden lg:flex' : 'flex',
        )}
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Конструктор сайта</h1>
            <p className="mt-0.5 text-[12.5px] text-zinc-500">Порядок и содержимое блоков главной страницы.</p>
          </div>
          <Button variant="secondary" size="sm" icon={<Eye />} className="lg:hidden" onClick={() => setShowPreview(true)}>
            Предпросмотр
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin sm:px-5">
          {query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : query.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <EmptyState
              icon={<LayoutTemplate />}
              title="Пока нет блоков"
              description="Добавьте первый блок главной страницы."
              action={
                <Button variant="primary" icon={<Plus />} onClick={() => setAddOpen(true)}>
                  Добавить блок
                </Button>
              }
            />
          ) : (
            <SortableList
              items={sections}
              getId={(s) => s.id}
              onReorder={onReorder}
              isItemPinned={(s) => s.isLocked}
              className="gap-2"
              renderItem={(section, { handle, isDragging }) => (
                <SectionRow
                  section={section}
                  handle={handle}
                  isDragging={isDragging}
                  onToggle={(enabled) => onToggle(section, enabled)}
                  onConfigure={() => setEditId(section.id)}
                  onDelete={() => setDeleteId(section.id)}
                  onFocus={() => previewRef.current?.post({ type: 'merenda:preview:scroll', sectionId: section.id })}
                />
              )}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <p className="text-[12.5px] text-zinc-500">
            {sections.length} {sections.length === 1 ? 'блок' : 'блоков'}
          </p>
          <Button variant="primary" icon={<Plus />} onClick={() => setAddOpen(true)}>
            Добавить блок
          </Button>
        </div>
      </aside>

      <PreviewFrame
        ref={previewRef}
        className={cn(showPreview ? 'flex' : 'hidden lg:flex')}
        toolbarExtra={
          <Button variant="secondary" size="sm" icon={<SlidersHorizontal />} className="lg:hidden" onClick={() => setShowPreview(false)}>
            Блоки
          </Button>
        }
      />

      <AddSectionDialog open={addOpen} onClose={() => setAddOpen(false)} present={present} onAdd={(t) => void onAdd(t)} adding={create.isPending} />

      <Drawer
        open={!!editing}
        onClose={() => setEditId(null)}
        width="md"
        title={editing ? SECTION_DEFINITIONS[editing.type].label : ''}
        description={editing ? SECTION_DEFINITIONS[editing.type].description : undefined}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditId(null)}>
              Отмена
            </Button>
            <Button variant="primary" icon={<Save />} loading={update.isPending} disabled={!dirty} onClick={() => void onSaveDraft()}>
              Сохранить
            </Button>
          </div>
        }
      >
        {editing && draft && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-zinc-700">Название блока</span>
              <Input value={draft.title} placeholder={SECTION_DEFINITIONS[editing.type].label} onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))} />
            </label>
            <div className="h-px bg-zinc-100" />
            <SectionSettingsForm
              fields={SECTION_DEFINITIONS[editing.type].fields}
              value={draft.settings}
              onChange={(settings) => setDraft((d) => (d ? { ...d, settings } : d))}
            />
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="Удалить блок?"
        description="Блок будет удалён с главной страницы. Это действие можно отменить, добавив блок заново."
        confirmLabel="Удалить"
        tone="danger"
        loading={remove.isPending}
      />
    </div>
  );
}
