import type { Modifier } from '@dnd-kit/core';

/** Local copies of @dnd-kit/modifiers helpers (package not installed). */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export const restrictToParentElement: Modifier = ({ containerNodeRect, draggingNodeRect, transform }) => {
  if (!draggingNodeRect || !containerNodeRect) return transform;
  const value = { ...transform };
  if (draggingNodeRect.top + transform.y <= containerNodeRect.top) {
    value.y = containerNodeRect.top - draggingNodeRect.top;
  } else if (draggingNodeRect.bottom + transform.y >= containerNodeRect.top + containerNodeRect.height) {
    value.y = containerNodeRect.top + containerNodeRect.height - draggingNodeRect.bottom;
  }
  return value;
};
