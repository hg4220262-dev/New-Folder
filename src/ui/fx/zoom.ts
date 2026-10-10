// The old window manager's minimise/maximise animation: a translucent caption
// rectangle that flies between the window and its taskbar button.
import { store } from '../../engine/state';
import { screenWidth } from '../../engine/windows';
import type { Win } from '../../engine/types';
import { toMonitor } from '../pointer';

export interface Rect { x: number; y: number; w: number; h: number }

export const winRect = (w: Win): Rect => (w.max ? { x: 0, y: 0, w: screenWidth(), h: 768 - 30 } : { x: w.x, y: w.y, w: w.w, h: w.h || 150 });

/** Bounds of a window's taskbar button, in monitor coordinates. */
export function taskRect(id: string): Rect {
  const el = document.querySelector(`[data-task="${id}"]`) as HTMLElement | null;
  if (!el) return { x: 120, y: 768 - 27, w: 160, h: 24 };
  const r = el.getBoundingClientRect();
  const a = toMonitor({ clientX: r.left, clientY: r.top });
  const b = toMonitor({ clientX: r.right, clientY: r.bottom });
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}

export function zoom(from: Rect, to: Rect, ms = 220) {
  if (store.settings.reduceMotion) return;
  const host = document.querySelector('.desktop');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'zoomrect';
  host.appendChild(el);
  const k = (r: Rect) => ({ left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  const anim = el.animate([{ ...k(from), opacity: 0.9 }, { ...k(to), opacity: 0.5 }], { duration: ms, easing: 'cubic-bezier(.4,0,.6,1)' });
  anim.onfinish = () => el.remove();
  anim.oncancel = () => el.remove();
}
