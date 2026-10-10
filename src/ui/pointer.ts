// Virtual cursor. The OS cursor is hidden everywhere; we draw an XP-style arrow.
// The drawn cursor is pinned inside the 4:3 monitor (like a real screen edge) until
// the story lets it escape into the black bars (edge >= 2, or full-screen mode).
import { store } from '../engine/state';
import { crtShift } from './fx/crt';

export const ptr = { x: 512, y: 384, rawX: 512, rawY: 384, scale: 1, ox: 0, oy: 0, vw: 1024, inside: true, lastInput: 0 };

let el: HTMLElement | null = null;
const listeners = new Set<() => void>();
export function onPointerMove(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

export function bindCursor(node: HTMLElement | null) { el = node; draw(); }

function draw() {
  if (!el) return;
  const sh = crtShift(ptr.x, ptr.y);
  el.style.transform = `translate(${ptr.ox + (ptr.x - sh.dx) * ptr.scale}px, ${ptr.oy + (ptr.y - sh.dy) * ptr.scale}px) scale(${ptr.scale})`;
}

let drift = 0;
function place(clientX: number, clientY: number) {
  ptr.rawX = (clientX - ptr.ox) / ptr.scale;
  ptr.rawY = (clientY - ptr.oy) / ptr.scale;
  const s = store.s;
  const free = (s?.edge ?? 0) >= 2 || s?.screenMode === 'full' || s?.phase === 'title';
  ptr.inside = ptr.rawX >= 0 && ptr.rawX < ptr.vw && ptr.rawY >= 0 && ptr.rawY < 768;
  if (free) {
    // In chapter 4+ the cursor sometimes lags a few pixels further into the black than the hand moved.
    if (!ptr.inside && (s?.edge ?? 0) >= 2) drift = Math.min(40, drift + 0.4); else drift = Math.max(0, drift - 2);
    ptr.x = ptr.rawX + (ptr.rawX < 0 ? -drift : ptr.rawX >= ptr.vw ? drift : 0);
    ptr.y = ptr.rawY;
  } else {
    ptr.x = Math.max(0, Math.min(ptr.vw - 1, ptr.rawX));
    ptr.y = Math.max(0, Math.min(767, ptr.rawY));
  }
  draw();
}

export function installPointer() {
  window.addEventListener('mousemove', (e) => { ptr.lastInput = performance.now(); place(e.clientX, e.clientY); listeners.forEach((l) => l()); }, { capture: true, passive: true });
  window.addEventListener('keydown', () => { ptr.lastInput = performance.now(); }, { capture: true, passive: true });
  // Clicks made while the hand is out in the black bars should not reach anything.
  const guard = (e: MouseEvent) => {
    const s = store.s;
    if (!s || s.phase === 'title' || s.screenMode === 'full') return;
    if (!ptr.inside && !(e.target as HTMLElement)?.closest?.('.pause-veil')) { e.preventDefault(); e.stopPropagation(); }
  };
  window.addEventListener('mousedown', guard, true);
  window.addEventListener('click', guard, true);
  window.addEventListener('dblclick', guard, true);
}

export function updateTransform(scale: number, ox: number, oy: number, vw: number) {
  ptr.scale = scale; ptr.ox = ox; ptr.oy = oy; ptr.vw = vw;
  draw();
}

/** Convert a mouse event to monitor coordinates. */
export function toMonitor(e: { clientX: number; clientY: number }) {
  return { x: (e.clientX - ptr.ox) / ptr.scale, y: (e.clientY - ptr.oy) / ptr.scale };
}
