import { useEffect, useRef, useState, type ReactNode } from 'react';
import { store } from '../engine/state';
import { closeWin, focusWin, minimizeWin, toggleMax, screenWidth } from '../engine/windows';
import type { Win } from '../engine/types';
import { toMonitor } from './pointer';
import { sfx } from '../engine/bus';
import { zoom, winRect, taskRect } from './fx/zoom';

function maxZoom(win: Win) {
  const from = winRect(win);
  toggleMax(win.id);
  zoom(from, winRect(win), 180);
}

export const Glyph = ({ k }: { k: 'min' | 'max' | 'restore' | 'close' }) => (
  <svg width="13" height="13" viewBox="0 0 13 13">
    {k === 'min' && <rect x="2" y="9" width="6" height="2.4" fill="#fff" />}
    {k === 'max' && <path d="M2 2h9v9H2z M2 2h9v2.5H2z" fill="none" stroke="#fff" strokeWidth="1.6" />}
    {k === 'restore' && <g fill="none" stroke="#fff" strokeWidth="1.4"><path d="M4.5 1.5h7v7" /><rect x="1.5" y="4.5" width="7" height="7" /></g>}
    {k === 'close' && <path d="M3 3l7 7M10 3l-7 7" stroke="#fff" strokeWidth="2" />}
  </svg>
);

interface Props {
  win: Win;
  active: boolean;
  icon?: ReactNode;
  children: ReactNode;
  resizable?: boolean;
  noMin?: boolean;
  noMax?: boolean;
  className?: string;
}

export function Window({ win, active, icon, children, resizable = true, noMin, noMax, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [painting, setPainting] = useState(store.settings.oldLag !== false && win.app !== 'dialog');
  useEffect(() => {
    if (!painting) return;
    const t = setTimeout(() => setPainting(false), 90 + Math.random() * 160);
    return () => clearTimeout(t);
  }, []);
  const dragging = useRef<{ dx: number; dy: number } | null>(null);

  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 0 || win.max) return;
    if ((e.target as HTMLElement).closest('.tbtn')) return;
    focusWin(win.id);
    const p = toMonitor(e);
    dragging.current = { dx: p.x - win.x, dy: p.y - win.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const q = toMonitor(ev);
      const sw = screenWidth();
      const free = (store.s.edge ?? 0) >= 2;
      // Before chapter 4 windows behave and keep their title bar on screen.
      win.x = free ? q.x - dragging.current.dx : Math.max(-win.w + 60, Math.min(sw - 60, q.x - dragging.current.dx));
      win.y = Math.max(0, Math.min(768 - 60, q.y - dragging.current.dy));
      if (store.s.glitch >= 2 && !store.settings.reduceMotion) leaveTrail(ref.current);
      if (ref.current) ref.current.style.transform = `translate(${win.x}px, ${win.y}px)`;
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('mouseup', onUp, true);
      store.bump();
    };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
  };

  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (win.max) return;
    const p0 = toMonitor(e);
    const w0 = win.w, h0 = win.h;
    const onMove = (ev: MouseEvent) => {
      const q = toMonitor(ev);
      win.w = Math.max(240, w0 + q.x - p0.x);
      win.h = Math.max(140, h0 + q.y - p0.y);
      store.bump();
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove, true); window.removeEventListener('mouseup', onUp, true); };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
  };

  if (win.min) return null;
  const sw = screenWidth();
  const style: React.CSSProperties = win.max
    ? { transform: 'translate(-3px, -1px)', width: sw + 6, height: 768 - 30 + 4, zIndex: win.z }
    : { transform: `translate(${win.x}px, ${win.y}px)`, width: win.w, height: win.h || undefined, zIndex: win.z };
  const title = win.notResponding ? `${win.title} (Not Responding)` : win.title;

  return (
    <div
      ref={ref}
      className={`win ${active ? '' : 'inactive'} ${win.max ? 'max' : ''} ${className}`}
      style={{ left: 0, top: 0, ...style }}
      onMouseDown={() => { if (!active) focusWin(win.id); }}
      data-win={win.id}
    >
      <div className="title" onMouseDown={startDrag} onDoubleClick={() => !noMax && maxZoom(win)}>
        <span className="title-icon">{icon}</span>
        <span className="title-text">{title}</span>
        {!noMin && <div className="tbtn" onClick={() => { sfx('click'); zoom(winRect(win), taskRect(win.id)); minimizeWin(win.id); }}><Glyph k="min" /></div>}
        {!noMax && <div className="tbtn" onClick={() => { sfx('click'); maxZoom(win); }}><Glyph k={win.max ? 'restore' : 'max'} /></div>}
        <div className="tbtn close" onClick={() => { sfx('click'); closeWin(win.id); }}><Glyph k="close" /></div>
      </div>
      <div className={`win-body ${win.notResponding ? 'notresp' : ''}`} style={painting ? { visibility: 'hidden' } : undefined}>
        {children}
        {win.notResponding && <div className="notresp-veil" />}
      </div>
      {resizable && !win.max && <div className="resize" onMouseDown={startResize} />}
    </div>
  );
}

/** Ghost copies left behind while dragging in later chapters (classic "window trail"). */
function leaveTrail(node: HTMLElement | null) {
  if (!node || Math.random() > 0.35) return;
  const parent = node.parentElement;
  if (!parent) return;
  const ghost = node.cloneNode(true) as HTMLElement;
  ghost.style.pointerEvents = 'none';
  ghost.style.animation = 'none';
  ghost.style.zIndex = String(Number(node.style.zIndex) - 1);
  ghost.removeAttribute('data-win');
  parent.appendChild(ghost);
  const life = store.s.glitch >= 3 ? 2400 : 160;
  setTimeout(() => ghost.remove(), life);
}
