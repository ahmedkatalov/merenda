import { useMemo, useState } from 'react';
import { CalendarClock, Clock, Pencil, Plus, Store, Trash2 } from 'lucide-react';
import type { Schedule } from '@merenda/shared';
import { useIsMobile } from '@/lib/useMediaQuery';
import { Button, ConfirmDialog, EmptyState, ErrorState, IconButton, PageHeader, Skeleton, Tabs } from '@/components/ui';
import { useDeleteSchedule, useSchedules } from '../hooks';
import { sortSchedules } from '../utils';
import { StatusSettingsCard } from '../components/StatusSettingsCard';
import { HoursEditor } from '../components/HoursEditor';
import { ExceptionsCard } from '../components/ExceptionsCard';
import { ScheduleNameDialog } from '../components/ScheduleNameDialog';

export default function HoursPage() {
  const schedules = useSchedules();
  const remove = useDeleteSchedule();
  const isMobile = useIsMobile();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'create' | 'rename' | null>(null);
  const [deleting, setDeleting] = useState<Schedule | null>(null);
  const [hoursDirty, setHoursDirty] = useState(false);
  /** Tab the user wants to open while the hours editor has unsaved changes. */
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const list = useMemo(() => sortSchedules(schedules.data ?? []), [schedules.data]);
  const selected = list.find((s) => s.id === selectedId) ?? list[0] ?? null;
  const isCustom = selected?.kind === 'custom';

  const selectTab = (id: string) => {
    if (id === selected?.id) return;
    if (hoursDirty) setPendingTab(id);
    else setSelectedId(id);
  };

  const tabs = list.map((s) => ({ value: s.id, label: s.name, icon: s.kind === 'venue' ? <Store /> : <Clock /> }));

  const editorActions =
    selected && isCustom ? (
      isMobile ? (
        <>
          <IconButton label="Переименовать" onClick={() => setDialog('rename')}>
            <Pencil />
          </IconButton>
          <IconButton label="Удалить" className="text-zinc-400 hover:text-red-600" onClick={() => setDeleting(selected)}>
            <Trash2 />
          </IconButton>
        </>
      ) : (
        <>
          <Button size="sm" variant="ghost" icon={<Pencil />} onClick={() => setDialog('rename')}>
            Переименовать
          </Button>
          <Button size="sm" variant="ghost" icon={<Trash2 />} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleting(selected)}>
            Удалить
          </Button>
        </>
      )
    ) : undefined;

  return (
    <>
      <PageHeader title="Режим работы" description="Часы работы, особые даты и статус заведения на сайте. Статус обновляется автоматически." />

      <div className="space-y-6">
        <StatusSettingsCard />

        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900">Расписания</h2>
              <p className="mt-0.5 text-[13px] text-zinc-500">Часы заведения и отдельные расписания — например, для кухни или бара.</p>
            </div>
            <Button variant="secondary" icon={<Plus />} onClick={() => setDialog('create')} disabled={!schedules.isSuccess}>
              Добавить расписание
            </Button>
          </div>

          {schedules.isPending ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
              <Skeleton className="h-[460px] rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          ) : schedules.isError ? (
            <ErrorState error={schedules.error} onRetry={() => void schedules.refetch()} />
          ) : !selected ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-zinc-200 bg-white">
              <EmptyState
                icon={<CalendarClock />}
                title="Расписаний пока нет"
                description="Добавьте расписание, чтобы указать часы работы."
                action={
                  <Button variant="primary" icon={<Plus />} onClick={() => setDialog('create')}>
                    Добавить расписание
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <Tabs variant="pills" items={tabs} value={selected.id} onChange={selectTab} className="-mx-1 px-1" />
              <HoursEditor key={selected.id} schedule={selected} actions={editorActions} onDirtyChange={setHoursDirty} />
              <ExceptionsCard schedule={selected} />
            </>
          )}
        </section>
      </div>

      <ScheduleNameDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        schedule={dialog === 'rename' ? selected : null}
        onCreated={(created) => (hoursDirty ? setPendingTab(created.id) : setSelectedId(created.id))}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        title={`Удалить расписание «${deleting?.name ?? ''}»?`}
        description="Меню, привязанные к нему, будут использовать часы заведения. Особые даты этого расписания тоже будут удалены."
        confirmLabel="Удалить"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          const id = deleting.id;
          remove.mutate(id, {
            onSuccess: () => {
              setDeleting(null);
              if (selectedId === id) setSelectedId(null);
            },
          });
        }}
      />

      <ConfirmDialog
        open={pendingTab !== null}
        onClose={() => setPendingTab(null)}
        tone="danger"
        title="Есть несохранённые изменения"
        description={`Часы работы «${selected?.name ?? ''}» не сохранены. При переходе к другому расписанию изменения будут потеряны.`}
        confirmLabel="Перейти без сохранения"
        cancelLabel="Остаться"
        onConfirm={() => {
          if (pendingTab) setSelectedId(pendingTab);
          setPendingTab(null);
          setHoursDirty(false);
        }}
      />
    </>
  );
}
