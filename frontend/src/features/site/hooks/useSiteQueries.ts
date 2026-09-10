import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreateOrderRequest, CreateOrderResponse, SiteStatus } from '@merenda/shared';
import { api, ApiRequestError } from '@/lib/api';

export const queryKeys = {
  site: ['site'] as const,
  menu: ['menu'] as const,
  status: ['status'] as const,
};

export function useSite() {
  return useQuery({
    queryKey: queryKeys.site,
    queryFn: ({ signal }) => api.site(signal),
    staleTime: 5 * 60_000,
  });
}

export function useMenu() {
  return useQuery({
    queryKey: queryKeys.menu,
    queryFn: ({ signal }) => api.menu(signal),
    staleTime: 2 * 60_000,
  });
}

export function useStatus(initial: SiteStatus | undefined) {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: ({ signal }) => api.status(signal),
    enabled: initial !== undefined,
    initialData: initial,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });
}

export function useCreateOrder() {
  return useMutation<CreateOrderResponse, ApiRequestError, CreateOrderRequest>({
    mutationFn: (body) => api.createOrder(body),
  });
}
