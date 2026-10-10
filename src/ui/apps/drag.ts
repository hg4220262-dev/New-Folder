// Lightweight drag-and-drop for files between Explorer windows, the desktop and the Recycle Bin.
import { store } from '../../engine/state';
import { moveNode } from '../../engine/actions';
import { isContainer } from '../../engine/fs';
import type { NodeId } from '../../engine/types';
import { toMonitor } from '../pointer';

export const drag = { id: null as NodeId | null, from: null as NodeId | null, active: false, sx: 0, sy: 0, x: 0, y: 0 };

/** Call on mousedown over an item. Dragging starts after 5px of movement. */
export function armDrag(e: React.MouseEvent, id: NodeId, from: NodeId) {
  if (e.button !== 0) return;
  const p = toMonitor(e);
  Object.assign(drag, { id, from, active: false, sx: p.x, sy: p.y, x: p.x, y: p.y });
  const onMove = (ev: MouseEvent) => {
    const q = toMonitor(ev);
    drag.x = q.x; drag.y = q.y;
    if (!drag.active && Math.hypot(q.x - drag.sx, q.y - drag.sy) > 5) drag.active = true;
    if (drag.active) store.bump();
  };
  const onUp = (ev: MouseEvent) => {
    window.removeEventListener('mousemove', onMove, true);
    window.removeEventListener('mouseup', onUp, true);
    if (drag.active && drag.id) {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const target = el?.closest('[data-drop]') as HTMLElement | null;
      const dest = target?.dataset.drop;
      if (dest && dest !== drag.from && dest !== drag.id && isContainer(store.s.fs[dest])) moveNode(drag.id, dest, drag.from ?? undefined);
    }
    drag.id = null; drag.active = false;
    store.bump();
  };
  window.addEventListener('mousemove', onMove, true);
  window.addEventListener('mouseup', onUp, true);
}
