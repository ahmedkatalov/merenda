import { IMAGE_MAX_BYTES, IMAGE_MIME_TYPES } from '@/lib/i18n';
import { formatBytes } from '@/lib/utils';

/** Mirrors server rules: jpeg/png/webp/gif, ≤ 10 MB. Returns an error message or null. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_MIME_TYPES.includes(file.type)) return 'Поддерживаются только JPEG, PNG, WebP и GIF';
  if (file.size > IMAGE_MAX_BYTES) return `Файл больше ${formatBytes(IMAGE_MAX_BYTES)} (${formatBytes(file.size)})`;
  return null;
}
