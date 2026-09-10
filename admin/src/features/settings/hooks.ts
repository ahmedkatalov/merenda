import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SettingsKey, SettingsMap } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { settingsApi } from './api';

export function useSetting<K extends SettingsKey>(key: K) {
  return useQuery({ queryKey: qk.setting(key), queryFn: ({ signal }) => settingsApi.get(key, signal) });
}

/**
 * Save one settings key. Callers handle field errors themselves (applyServerErrors);
 * a generic toast is shown only when `silent` is false.
 */
export function useSaveSetting<K extends SettingsKey>(key: K, options: { silent?: boolean; successMessage?: string } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: SettingsMap[K]) => settingsApi.put(key, value),
    onSuccess: (saved) => {
      qc.setQueryData(qk.setting(key), saved);
      void qc.invalidateQueries({ queryKey: qk.settings });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      if (key === 'status') void qc.invalidateQueries({ queryKey: qk.siteStatus });
      if (!options.silent) toast.success(options.successMessage ?? 'Сохранено');
    },
    onError: (e) => {
      if (!options.silent) toast.error(errorMessage(e));
    },
  });
}
