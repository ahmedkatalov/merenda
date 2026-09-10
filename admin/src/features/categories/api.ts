import type { Category, CategoryInput, ReorderRequest } from '@merenda/shared';
import { admin } from '@/lib/api';

export const categoriesApi = {
  list: (menuId?: string | null, signal?: AbortSignal) => admin.get<Category[]>('/categories', { menuId: menuId ?? undefined }, signal),
  create: (body: CategoryInput) => admin.post<Category>('/categories', body),
  update: (id: string, body: Partial<CategoryInput>) => admin.patch<Category>(`/categories/${id}`, body),
  remove: (id: string) => admin.delete(`/categories/${id}`),
  reorder: (body: ReorderRequest) => admin.put<void>('/categories/reorder', body),
};
