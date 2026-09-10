import { API_URL } from './env';

/** Prefix root-relative upload paths with the API origin when it differs from ours. */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
