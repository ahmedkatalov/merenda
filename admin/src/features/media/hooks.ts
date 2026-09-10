import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { mediaApi, type MediaListParams } from './api';
import { useMediaCache } from './cache';

const PER_PAGE = 40;

export function useMediaList(params: Pick<MediaListParams, 'kind' | 'q'>) {
  const remember = useMediaCache((s) => s.remember);
  return useInfiniteQuery({
    queryKey: qk.media({ kind: params.kind || undefined, q: params.q || undefined }),
    queryFn: async ({ pageParam, signal }) => {
      const res = await mediaApi.list({ ...params, page: pageParam, perPage: PER_PAGE }, signal);
      remember(res.items);
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.perPage < last.total ? last.page + 1 : undefined),
  });
}

export function useInvalidateMedia() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['media'] });
}

export function useUpdateMediaAlt() {
  const invalidate = useInvalidateMedia();
  const remember = useMediaCache((s) => s.remember);
  return useMutation({
    mutationFn: ({ id, alt }: { id: string; alt: string }) => mediaApi.updateAlt(id, alt),
    onSuccess: (media) => {
      remember(media);
      void invalidate();
      toast.success('Сохранено');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useDeleteMedia() {
  const invalidate = useInvalidateMedia();
  const forget = useMediaCache((s) => s.forget);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaApi.remove(id),
    onSuccess: (_, id) => {
      forget(id);
      void invalidate();
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: ['categories'] });
      void qc.invalidateQueries({ queryKey: qk.sections });
      toast.success('Удалено');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
