import type { Media, MediaKind, Paginated } from '@merenda/shared';
import { admin, uploadWithProgress } from '@/lib/api';

export interface MediaListParams {
  kind?: MediaKind | '';
  q?: string;
  page?: number;
  perPage?: number;
}

export const mediaApi = {
  list: (params: MediaListParams, signal?: AbortSignal) =>
    admin.get<Paginated<Media>>('/media', { kind: params.kind || undefined, q: params.q || undefined, page: params.page ?? 1, perPage: params.perPage ?? 40 }, signal),
  upload: (file: File, alt: string | undefined, onProgress?: (f: number) => void, signal?: AbortSignal) => {
    const fd = new FormData();
    fd.append('file', file);
    if (alt) fd.append('alt', alt);
    return uploadWithProgress<Media>('/media', fd, onProgress, signal);
  },
  updateAlt: (id: string, alt: string) => admin.patch<Media>(`/media/${id}`, { alt }),
  remove: (id: string) => admin.delete(`/media/${id}`),
};
