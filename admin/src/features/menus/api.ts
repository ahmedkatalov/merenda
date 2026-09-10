import type { Menu, MenuInput, ReorderRequest, Schedule } from '@merenda/shared';
import { admin } from '@/lib/api';

export const menusApi = {
  list: (signal?: AbortSignal) => admin.get<Menu[]>('/menus', undefined, signal),
  create: (body: MenuInput) => admin.post<Menu>('/menus', body),
  update: (id: string, body: Partial<MenuInput>) => admin.patch<Menu>(`/menus/${id}`, body),
  remove: (id: string) => admin.delete(`/menus/${id}`),
  reorder: (body: ReorderRequest) => admin.put<void>('/menus/reorder', body),
  schedules: (signal?: AbortSignal) => admin.get<Schedule[]>('/schedules', undefined, signal),
};
