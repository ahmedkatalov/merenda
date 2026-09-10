import type { Order, OrderListQuery, OrderStatus, Paginated } from '@merenda/shared';
import { admin } from '@/lib/api';

export const ordersApi = {
  list: (query: OrderListQuery, signal?: AbortSignal) =>
    admin.get<Paginated<Order>>('/orders', { status: query.status, type: query.type, page: query.page ?? 1, perPage: query.perPage ?? 20 }, signal),
  get: (id: string, signal?: AbortSignal) => admin.get<Order>(`/orders/${id}`, undefined, signal),
  setStatus: (id: string, status: OrderStatus) => admin.patch<Order>(`/orders/${id}/status`, { status }),
  remove: (id: string) => admin.delete(`/orders/${id}`),
};
