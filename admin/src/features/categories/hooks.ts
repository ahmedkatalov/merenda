import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Category, CategoryInput } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { categoriesApi } from './api';

export function useCategories(menuId?: string | null, enabled = true) {
  return useQuery({ queryKey: qk.categories(menuId), queryFn: ({ signal }) => categoriesApi.list(menuId, signal), enabled });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['categories'] });
  void qc.invalidateQueries({ queryKey: ['products'] });
  void qc.invalidateQueries({ queryKey: qk.dashboard });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryInput) => categoriesApi.create(body),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Категория создана');
    },
  });
}

export function useUpdateCategory(menuId: string | null | undefined, options: { silent?: boolean } = {}) {
  const qc = useQueryClient();
  const key = qk.categories(menuId);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CategoryInput> }) => categoriesApi.update(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Category[]>(key);
      if (prev) qc.setQueryData<Category[]>(key, prev.map((c) => (c.id === id ? { ...c, ...body } : c)));
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(errorMessage(e));
    },
    onSuccess: () => {
      if (!options.silent) toast.success('Сохранено');
    },
    onSettled: () => invalidateAll(qc),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Удалено');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useReorderCategories(menuId: string | null | undefined) {
  const qc = useQueryClient();
  const key = qk.categories(menuId);
  return useMutation({
    mutationFn: (ids: string[]) => categoriesApi.reorder({ ids }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Category[]>(key);
      if (prev) {
        const byId = new Map(prev.map((c) => [c.id, c]));
        qc.setQueryData<Category[]>(key, ids.map((id, i) => ({ ...byId.get(id)!, sortOrder: i })));
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(errorMessage(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}
