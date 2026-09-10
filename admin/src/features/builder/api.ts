import type { PageSection, ReorderRequest, SectionInput, SectionPatch } from '@merenda/shared';
import { admin } from '@/lib/api';

export const sectionsApi = {
  list: (signal?: AbortSignal) => admin.get<PageSection[]>('/sections', undefined, signal),
  create: (body: SectionInput) => admin.post<PageSection>('/sections', body),
  update: (id: string, body: SectionPatch) => admin.patch<PageSection>(`/sections/${id}`, body),
  remove: (id: string) => admin.delete(`/sections/${id}`),
  reorder: (body: ReorderRequest) => admin.put<void>('/sections/reorder', body),
};
