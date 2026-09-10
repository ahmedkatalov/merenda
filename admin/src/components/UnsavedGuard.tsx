import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ui';

/**
 * Warns before leaving a page with unsaved changes: browser navigation via
 * `beforeunload`, in-app navigation via react-router's blocker + ConfirmDialog.
 */
export function UnsavedGuard({ when }: { when: boolean }) {
  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname);

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      onConfirm={() => blocker.proceed?.()}
      title="Покинуть страницу?"
      description="Есть несохранённые изменения. Если уйти сейчас, они будут потеряны."
      confirmLabel="Уйти без сохранения"
      cancelLabel="Остаться"
      tone="danger"
    />
  );
}
