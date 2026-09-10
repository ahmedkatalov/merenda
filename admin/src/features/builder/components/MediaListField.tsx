import { useState } from 'react';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mediaUrl } from '@/lib/media';
import { Badge, MediaPicker } from '@/components/ui';
import { useMediaById } from '@/features/media/cache';

function Thumb({ id, onRemove }: { id: string; onRemove: () => void }) {
  const media = useMediaById(id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100', isDragging && 'z-10 shadow-pop ring-1 ring-zinc-400')}>
      <button type="button" className="size-full cursor-grab touch-none focus-ring active:cursor-grabbing" aria-label="Перетащить" {...attributes} {...listeners}>
        {media ? <img src={mediaUrl(media.thumbUrl)} alt={media.alt || ''} className="size-full object-cover" draggable={false} /> : <span className="flex size-full items-center justify-center text-[11px] text-zinc-400">…</span>}
      </button>
      {media?.kind === 'gif' && (
        <Badge tone="dark" size="sm" className="pointer-events-none absolute left-1 top-1">
          GIF
        </Badge>
      )}
      <button type="button" onClick={onRemove} aria-label="Убрать" className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 focus:opacity-100 focus-ring">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function MediaListField({ value, onChange, label, help }: { value: string[]; onChange: (ids: string[]) => void; label?: string; help?: string }) {
  const [open, setOpen] = useState(false);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 4 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = value.indexOf(String(active.id));
    const to = value.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChange(arrayMove(value, from, to));
  };
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-zinc-700">{label}</span>
          <span className="text-[12px] text-zinc-400">{value.length > 0 ? `${value.length} шт.` : ''}</span>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {value.map((id) => (
              <Thumb key={id} id={id} onRemove={() => onChange(value.filter((v) => v !== id))} />
            ))}
            <button type="button" onClick={() => setOpen(true)} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-[11px] text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 focus-ring">
              <ImagePlus className="size-4" />
              Добавить
            </button>
          </div>
        </SortableContext>
      </DndContext>
      {help && <p className="text-[13px] text-zinc-500">{help}</p>}
      <MediaPicker open={open} onClose={() => setOpen(false)} accept="any" title="Добавить в галерею" onSelect={(m) => onChange(value.includes(m.id) ? value : [...value, m.id])} />
    </div>
  );
}
