import type { Media } from '@merenda/shared';
import { cn } from '@/lib/utils';
import { mediaUrl } from '@/lib/media';
import { Badge } from '@/components/ui';

export interface MediaTileProps {
  media: Media;
  selected?: boolean;
  onClick: () => void;
}

export function MediaTile({ media, selected, onClick }: MediaTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={media.originalName}
      title={media.originalName}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 transition-all hover:border-zinc-400 focus-ring',
        selected && 'border-zinc-900 ring-2 ring-zinc-900/15 hover:border-zinc-900',
      )}
    >
      <img src={mediaUrl(media.thumbUrl)} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      {media.kind === 'gif' && (
        <Badge tone="dark" size="sm" className="absolute left-1.5 top-1.5">
          GIF
        </Badge>
      )}
      {/* File name on hover — pointer devices only; touch users get the name in the drawer. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-zinc-900/75 via-zinc-900/30 to-transparent px-2 pb-1.5 pt-7 text-left opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-fine:block"
      >
        <span className="block truncate text-[11.5px] font-medium text-white">{media.originalName}</span>
      </span>
    </button>
  );
}
