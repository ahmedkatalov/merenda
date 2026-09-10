import type { DashboardStats, SiteStatus, StatusSettings } from '@merenda/shared';
import { admin, pub } from '@/lib/api';

export const dashboardApi = {
  stats: (signal?: AbortSignal) => admin.get<DashboardStats>('/dashboard', undefined, signal),
  siteStatus: () => pub.get<SiteStatus>('/status'),
  setStatus: (body: StatusSettings) => admin.put<StatusSettings>('/settings/status', body),
};
