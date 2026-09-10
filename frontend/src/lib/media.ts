import type { Media } from '@merenda/shared';
import { mediaUrl } from './api';

export interface ImageSource {
  src: string;
  srcSet?: string;
  isGif: boolean;
  alt: string;
  width: number;
  height: number;
}

/**
 * Builds <img> attributes for a media object. GIFs always use the original
 * URL (thumbs would lose animation); images get thumb/medium in srcSet.
 */
export function imageSource(media: Media | null | undefined, prefer: 'thumb' | 'medium' = 'thumb'): ImageSource | null {
  if (!media) return null;
  const isGif = media.kind === 'gif' || media.mime === 'image/gif';
  if (isGif) {
    return { src: mediaUrl(media.url), isGif: true, alt: media.alt, width: media.width, height: media.height };
  }
  const thumb = mediaUrl(media.thumbUrl || media.url);
  const medium = mediaUrl(media.mediumUrl || media.url);
  const sources = new Map<string, number>();
  sources.set(thumb, 480);
  sources.set(medium, 1400);
  const srcSet = Array.from(sources.entries())
    .map(([url, w]) => `${url} ${w}w`)
    .join(', ');
  return {
    src: prefer === 'thumb' ? thumb : medium,
    srcSet: sources.size > 1 ? srcSet : undefined,
    isGif: false,
    alt: media.alt,
    width: media.width,
    height: media.height,
  };
}

export const ASPECT_CLASS: Record<'1:1' | '4:3' | '3:2' | '16:9', string> = {
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '3:2': 'aspect-[3/2]',
  '16:9': 'aspect-video',
};
