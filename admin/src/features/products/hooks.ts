import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Availability, Product, ProductInput, ProductListItem } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { AVAILABILITY_LABELS } from '@/lib/i18n';
import { productsApi, type ProductFilters } from './api';

const cleanFilters = (f: ProductFilters): Record<string, string | undefined> => ({
  menuId: f.menuId || undefined,
  categoryId: f.categoryId || undefined,
  availability: f.availability || undefined,
  q: f.q?.trim() || undefined,
});

export function useProducts(filters: ProductFilters, enabled = true) {
  const clean = cleanFilters(filters);
  return useQuery({ queryKey: qk.products(clean), queryFn: ({ signal }) => productsApi.list(clean, signal), enabled, placeholderData: (prev) => prev });
}

export function useProduct(id: string | undefined) {
  return useQuery({ queryKey: qk.product(id ?? ''), queryFn: ({ signal }) => productsApi.get(id!, signal), enabled: !!id });
}

function invalidateProducts(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['products'] });
  void qc.invalidateQueries({ queryKey: qk.dashboard });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductInput) => productsApi.create(body),
    onSuccess: (product) => {
      qc.setQueryData(qk.product(product.id), product);
      invalidateProducts(qc);
      toast.success('Блюдо создано');
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ProductInput> }) => productsApi.update(id, body),
    onSuccess: (product) => {
      qc.setQueryData(qk.product(product.id), product);
      invalidateProducts(qc);
      toast.success('Сохранено');
    },
  });
}

/** Optimistic across every cached product list. */
export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, availability }: { id: string; availability: Availability }) => productsApi.setAvailability(id, availability),
    onMutate: async ({ id, availability }) => {
      await qc.cancelQueries({ queryKey: ['products'] });
      const snapshots = qc.getQueriesData<ProductListItem[]>({ queryKey: ['products'] });
      qc.setQueriesData<ProductListItem[]>({ queryKey: ['products'] }, (old) => old?.map((p) => (p.id === id ? { ...p, availability } : p)));
      qc.setQueryData<Product>(qk.product(id), (old) => (old ? { ...old, availability } : old));
      return { snapshots };
    },
    onError: (e, _v, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(errorMessage(e));
    },
    onSuccess: (_p, { availability }) => toast.success(AVAILABILITY_LABELS[availability], { duration: 1500 }),
    onSettled: () => invalidateProducts(qc),
  });
}

export function useQuickPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priceMinor }: { id: string; priceMinor: number }) => productsApi.update(id, { priceMinor }),
    onMutate: async ({ id, priceMinor }) => {
      await qc.cancelQueries({ queryKey: ['products'] });
      const snapshots = qc.getQueriesData<ProductListItem[]>({ queryKey: ['products'] });
      qc.setQueriesData<ProductListItem[]>({ queryKey: ['products'] }, (old) => old?.map((p) => (p.id === id ? { ...p, priceMinor } : p)));
      return { snapshots };
    },
    onError: (e, _v, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(errorMessage(e));
    },
    onSuccess: () => toast.success('Цена обновлена', { duration: 1500 }),
    onSettled: () => invalidateProducts(qc),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      invalidateProducts(qc);
      toast.success('Блюдо удалено');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useReorderProducts(listKey: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => productsApi.reorder({ ids }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: listKey });
      const prev = qc.getQueryData<ProductListItem[]>(listKey);
      if (prev) {
        const byId = new Map(prev.map((p) => [p.id, p]));
        qc.setQueryData<ProductListItem[]>(listKey, ids.map((id, i) => ({ ...byId.get(id)!, sortOrder: i })));
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(listKey, ctx.prev);
      toast.error(errorMessage(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
