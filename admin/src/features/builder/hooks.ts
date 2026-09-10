import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PageSection, SectionInput, SectionPatch } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { sectionsApi } from './api';

/** Header first, footer last, everything else by sortOrder. */
export function sortSections(list: PageSection[]): PageSection[] {
  const rank = (s: PageSection) => (s.type === 'header' ? -1 : s.type === 'footer' ? Number.MAX_SAFE_INTEGER : s.sortOrder);
  return [...list].sort((a, b) => rank(a) - rank(b));
}

export function useSections() {
  return useQuery({ queryKey: qk.sections, queryFn: ({ signal }) => sectionsApi.list(signal), select: sortSections });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SectionInput) => sectionsApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.sections });
      toast.success('Блок добавлен');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useUpdateSection(options: { silent?: boolean } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SectionPatch }) => sectionsApi.update(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: qk.sections });
      const prev = qc.getQueryData<PageSection[]>(qk.sections);
      if (prev) qc.setQueryData<PageSection[]>(qk.sections, prev.map((s) => (s.id === id ? { ...s, ...body, settings: body.settings ?? s.settings } : s)));
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.sections, ctx.prev);
      toast.error(errorMessage(e));
    },
    onSuccess: (section) => {
      qc.setQueryData<PageSection[]>(qk.sections, (old) => old?.map((s) => (s.id === section.id ? section : s)));
      if (!options.silent) toast.success('Блок сохранён');
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.sections }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sectionsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.sections });
      toast.success('Блок удалён');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useReorderSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => sectionsApi.reorder({ ids }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: qk.sections });
      const prev = qc.getQueryData<PageSection[]>(qk.sections);
      if (prev) {
        const byId = new Map(prev.map((s) => [s.id, s]));
        qc.setQueryData<PageSection[]>(
          qk.sections,
          ids.map((id) => byId.get(id)).filter((s): s is PageSection => !!s).map((s, i) => ({ ...s, sortOrder: i })),
        );
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.sections, ctx.prev);
      toast.error(errorMessage(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.sections }),
  });
}
