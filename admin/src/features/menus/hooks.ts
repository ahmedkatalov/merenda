import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Menu, MenuInput } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { menusApi } from './api';

export function useMenus() {
  return useQuery({ queryKey: qk.menus, queryFn: ({ signal }) => menusApi.list(signal) });
}

export function useSchedules() {
  return useQuery({ queryKey: qk.schedules, queryFn: ({ signal }) => menusApi.schedules(signal) });
}

export function useCreateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MenuInput) => menusApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.menus });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      toast.success('Меню создано');
    },
  });
}

export function useUpdateMenu(options: { silent?: boolean } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<MenuInput> }) => menusApi.update(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: qk.menus });
      const prev = qc.getQueryData<Menu[]>(qk.menus);
      if (prev) qc.setQueryData<Menu[]>(qk.menus, prev.map((m) => (m.id === id ? { ...m, ...body } : m)));
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.menus, ctx.prev);
      toast.error(errorMessage(e));
    },
    onSuccess: () => {
      if (!options.silent) toast.success('Сохранено');
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.menus });
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menusApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.menus });
      void qc.invalidateQueries({ queryKey: ['categories'] });
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      toast.success('Удалено');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useReorderMenus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => menusApi.reorder({ ids }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: qk.menus });
      const prev = qc.getQueryData<Menu[]>(qk.menus);
      if (prev) {
        const byId = new Map(prev.map((m) => [m.id, m]));
        qc.setQueryData<Menu[]>(
          qk.menus,
          ids.map((id, i) => ({ ...byId.get(id)!, sortOrder: i })).filter((m) => m.id),
        );
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.menus, ctx.prev);
      toast.error(errorMessage(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.menus }),
  });
}
