import type { ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from './dndModifiers';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortableRenderCtx {
  handle: ReactNode;
  isDragging: boolean;
  index: number;
}

export interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[], from: number, to: number) => void;
  renderItem: (item: T, ctx: SortableRenderCtx) => ReactNode;
  disabled?: boolean;
  /** Pinned items are not draggable and cannot be displaced. */
  isItemPinned?: (item: T) => boolean;
  className?: string;
  itemClassName?: string;
  as?: 'ul' | 'div';
}

function SortableRow<T>({ item, id, index, pinned, disabled, renderItem, className }: { item: T; id: string; index: number; pinned: boolean; disabled: boolean; renderItem: SortableListProps<T>['renderItem']; className?: string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: disabled || pinned });
  const style = { transform: CSS.Translate.toString(transform), transition };
  const handle =
    pinned || disabled ? (
      <span className="inline-flex size-9 shrink-0 items-center justify-center text-zinc-300" aria-hidden="true">
        <GripVertical className="size-4" />
      </span>
    ) : (
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Перетащить"
        className={cn('inline-flex size-9 shrink-0 touch-none items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-ring', isDragging ? 'cursor-grabbing' : 'cursor-grab')}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
    );
  return (
    <li ref={setNodeRef} style={style} className={cn('relative list-none', isDragging && 'z-10', className)}>
      {renderItem(item, { handle, isDragging, index })}
    </li>
  );
}

export function SortableList<T>({ items, getId, onReorder, renderItem, disabled = false, isItemPinned, className, itemClassName }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const target = items[to];
    if (target && isItemPinned?.(target)) return;
    onReorder(arrayMove(items, from, to), from, to);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cn('flex flex-col', className)}>
          {items.map((item, index) => (
            <SortableRow key={getId(item)} id={getId(item)} item={item} index={index} pinned={isItemPinned?.(item) ?? false} disabled={disabled} renderItem={renderItem} className={itemClassName} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
