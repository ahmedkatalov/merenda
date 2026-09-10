import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { StatusSettings } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { useIsAuthenticated } from '@/features/auth/hooks';
import { dashboardApi } from './api';

export function useDashboard(options: { refetchInterval?: number } = {}) {
  const authed = useIsAuthenticated();
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: ({ signal }) => dashboardApi.stats(signal),
    enabled: authed,
    refetchInterval: options.refetchInterval ?? 60_000,
    staleTime: 15_000,
  });
}

export function useSiteStatus() {
  return useQuery({ queryKey: qk.siteStatus, queryFn: dashboardApi.siteStatus, refetchInterval: 60_000, staleTime: 30_000 });
}

export function useSetVenueStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StatusSettings) => dashboardApi.setStatus(body),
    onSuccess: (_, body) => {
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      void qc.invalidateQueries({ queryKey: qk.siteStatus });
      void qc.invalidateQueries({ queryKey: qk.settings });
      toast.success(body.mode === 'temporarily_closed' ? 'Заведение временно закрыто' : 'Заведение снова работает по расписанию');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
