import type { Availability, Product, ProductInput, ProductListItem, ReorderRequest } from '@merenda/shared';
import { admin } from '@/lib/api';

export interface ProductFilters {
  menuId?: string;
  categoryId?: string;
  availability?: Availability;
  q?: string;
}

export const productsApi = {
  list: (filters: ProductFilters, signal?: AbortSignal) => admin.get<ProductListItem[]>('/products', { ...filters }, signal),
  get: (id: string, signal?: AbortSignal) => admin.get<Product>(`/products/${id}`, undefined, signal),
  create: (body: ProductInput) => admin.post<Product>('/products', body),
  update: (id: string, body: Partial<ProductInput>) => admin.patch<Product>(`/products/${id}`, body),
  setAvailability: (id: string, availability: Availability) => admin.patch<Product>(`/products/${id}/availability`, { availability }),
  remove: (id: string) => admin.delete(`/products/${id}`),
  reorder: (body: ReorderRequest) => admin.put<void>('/products/reorder', body),
};
