import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ORDER_STATUS_LABELS, type Order, type OrderListQuery, type OrderStatus } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { ordersApi } from './api';

export const ORDERS_PER_PAGE = 20;

export function useOrders(query: OrderListQuery) {
  const clean = { status: query.status, type: query.type, page: query.page ?? 1, perPage: query.perPage ?? ORDERS_PER_PAGE };
  return useQuery({
    queryKey: qk.orders(clean),
    queryFn: ({ signal }) => ordersApi.list(clean, signal),
    refetchInterval: 30_000,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({ queryKey: qk.order(id ?? ''), queryFn: ({ signal }) => ordersApi.get(id!, signal), enabled: !!id });
}

function invalidateOrders(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['orders'] });
  void qc.invalidateQueries({ queryKey: qk.dashboard });
}

export function useSetOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => ordersApi.setStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: qk.order(id) });
      const prev = qc.getQueryData<Order>(qk.order(id));
      if (prev) qc.setQueryData<Order>(qk.order(id), { ...prev, status });
      return { prev };
    },
    onError: (e, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.order(id), ctx.prev);
      toast.error(errorMessage(e));
    },
    onSuccess: (order) => {
      qc.setQueryData(qk.order(order.id), order);
      toast.success(`Заказ №${order.number}: ${ORDER_STATUS_LABELS[order.status].toLowerCase()}`);
    },
    onSettled: (_d, _e, { id }) => {
      invalidateOrders(qc);
      void qc.invalidateQueries({ queryKey: qk.order(id) });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.remove(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: qk.order(id) });
      invalidateOrders(qc);
      toast.success('Заказ удалён');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
