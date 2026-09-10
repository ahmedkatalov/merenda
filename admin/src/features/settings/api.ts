import type { SettingsKey, SettingsMap } from '@merenda/shared';
import { admin } from '@/lib/api';

/** Typed access to `/settings/:key` — shared by Settings, WhatsApp, Hours and Appearance pages. */
export const settingsApi = {
  get: <K extends SettingsKey>(key: K, signal?: AbortSignal) => admin.get<SettingsMap[K]>(`/settings/${key}`, undefined, signal),
  put: <K extends SettingsKey>(key: K, value: SettingsMap[K]) => admin.put<SettingsMap[K]>(`/settings/${key}`, value),
};
