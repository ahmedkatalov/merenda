import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api';
import { uid } from '@/lib/utils';
import { mediaApi } from '../api';
import { useMediaCache } from '../cache';
import { useInvalidateMedia } from '../hooks';
import { validateImageFile } from '../upload';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  /** Object URL for the thumbnail — revoked when the row is removed. */
  previewUrl: string;
  /** 0..1 */
  progress: number;
  status: UploadStatus;
  error?: string;
}

const MAX_CONCURRENT = 2;
const DONE_DISMISS_MS = 2000;

/**
 * Local upload queue: validates files, uploads at most two at a time with progress,
 * remembers each result in the media cache and, once the batch settles, invalidates
 * the list and reports a single toast.
 *
 * All mutable bookkeeping lives in refs so the async upload chain never reads stale state.
 */
export function useUploadQueue() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);
  const activeRef = useRef(0);
  const uploadedRef = useRef(0);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const invalidate = useInvalidateMedia();
  const invalidateRef = useRef(invalidate);

  useEffect(() => {
    invalidateRef.current = invalidate;
  }, [invalidate]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const t of timers) clearTimeout(t);
      timers.clear();
      for (const item of itemsRef.current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  function commit(next: UploadItem[]) {
    itemsRef.current = next;
    setItems(next);
  }

  function patch(id: string, changes: Partial<UploadItem>) {
    commit(itemsRef.current.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  }

  function dismiss(id: string) {
    const target = itemsRef.current.find((i) => i.id === id);
    if (!target) return;
    URL.revokeObjectURL(target.previewUrl);
    commit(itemsRef.current.filter((i) => i.id !== id));
  }

  function clearFinished() {
    for (const i of itemsRef.current) if (i.status === 'done' || i.status === 'error') URL.revokeObjectURL(i.previewUrl);
    commit(itemsRef.current.filter((i) => i.status === 'queued' || i.status === 'uploading'));
  }

  function hasActive() {
    return itemsRef.current.some((i) => i.status === 'queued' || i.status === 'uploading');
  }

  function finishBatch() {
    const n = uploadedRef.current;
    uploadedRef.current = 0;
    void invalidateRef.current();
    if (n > 0) toast.success(`Загружено: ${n}`);
  }

  async function run(item: UploadItem) {
    try {
      const media = await mediaApi.upload(item.file, undefined, (fraction) => patch(item.id, { progress: fraction }));
      useMediaCache.getState().remember(media);
      uploadedRef.current += 1;
      patch(item.id, { status: 'done', progress: 1 });
      const t = setTimeout(() => {
        timersRef.current.delete(t);
        dismiss(item.id);
      }, DONE_DISMISS_MS);
      timersRef.current.add(t);
    } catch (e) {
      patch(item.id, { status: 'error', error: errorMessage(e) });
    } finally {
      activeRef.current -= 1;
      if (hasActive()) pump();
      else finishBatch();
    }
  }

  function pump() {
    while (activeRef.current < MAX_CONCURRENT) {
      const next = itemsRef.current.find((i) => i.status === 'queued');
      if (!next) return;
      activeRef.current += 1;
      patch(next.id, { status: 'uploading' });
      void run(next);
    }
  }

  /** Validate and queue files; invalid ones are reported with a toast and skipped. */
  function enqueue(files: FileList | File[] | null | undefined) {
    if (!files) return;
    const accepted: UploadItem[] = [];
    for (const file of Array.from(files)) {
      const err = validateImageFile(file);
      if (err) {
        toast.error(`${file.name}: ${err}`);
        continue;
      }
      accepted.push({ id: uid(), file, previewUrl: URL.createObjectURL(file), progress: 0, status: 'queued' });
    }
    if (accepted.length === 0) return;
    commit([...itemsRef.current, ...accepted]);
    pump();
  }

  const isUploading = items.some((i) => i.status === 'queued' || i.status === 'uploading');

  return { items, enqueue, dismiss, clearFinished, isUploading };
}
