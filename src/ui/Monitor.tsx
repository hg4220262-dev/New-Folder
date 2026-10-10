import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { updateTransform } from './pointer';
import { SCREEN_H, SCREEN_W } from '../brand';
import { store, useStore } from '../engine/state';
import { display } from '../engine/windows';
import { MILL_ROW } from '../story/people';

export interface Fit { scale: number; ox: number; oy: number; vw: number }

/** Height hidden by the camera housing on notched MacBooks; the picture sits below it. */
display.safeTop = Math.max(0, window.host?.safeTop ?? 0);
const fitListeners = new Set<() => void>();
window.host?.onSafeTop?.((px) => { display.safeTop = Math.max(0, px); fitListeners.forEach((l) => l()); });

function computeFit(full: boolean): Fit {
  const safeTop = display.safeTop;
  const W = window.innerWidth, H = window.innerHeight - safeTop;
  if (full) {
    const scale = H / SCREEN_H;
    return { scale, ox: 0, oy: safeTop, vw: Math.ceil(W / scale) };
  }
  const scale = Math.min(W / SCREEN_W, H / SCREEN_H);
  return { scale, ox: Math.round((W - SCREEN_W * scale) / 2), oy: safeTop + Math.round((H - SCREEN_H * scale) / 2), vw: SCREEN_W };
}

export function useFit(): Fit {
  const s = useStore();
  const full = s?.screenMode === 'full';
  const [fit, setFit] = useState(() => computeFit(full));
  useLayoutEffect(() => {
    const on = () => setFit(computeFit(full));
    on();
    window.addEventListener('resize', on);
    fitListeners.add(on);
    return () => { window.removeEventListener('resize', on); fitListeners.delete(on); };
  }, [full]);
  useEffect(() => { updateTransform(fit.scale, fit.ox, fit.oy, fit.vw); }, [fit]);
  return fit;
}

/** The fake monitor: a 1024x768 (or full-width) surface scaled to fill the real screen height. */
export function Monitor({ children, className = '', fit }: { children: ReactNode; className?: string; fit: Fit }) {
  const s = useStore();
  const leak = (s?.edge ?? 0) >= 1;
  const crt = store.settings.crt !== false && s?.screenMode !== 'full' && !store.ui.flatCapture;
  const transform = `translate(${fit.ox}px, ${fit.oy}px) scale(${fit.scale})`;
  return (
    <div
      className={`monitor ${s?.screenMode === 'full' ? 'full' : ''} ${leak ? 'leak' : ''} ${crt ? 'crt' : ''} ${className}`}
      style={{ left: 0, top: 0, width: fit.vw, transform, ['--mt' as any]: transform }}
      id="monitor"
    >
      <div className="crt-layer" style={crt && store.settings.crtCurve !== false ? { filter: 'url(#crtwarp)' } : undefined}>{children}</div>
    </div>
  );
}

/** Content that lives in the black bars (chapter 4+): faint scrolling filenames. */
export function EdgeLayer({ fit }: { fit: Fit }) {
  const s = useStore();
  const level = s?.edge ?? 0;
  if (level < 2 || s.phase !== 'desktop' || s.screenMode === 'full' || fit.ox < 8) return null;
  const names = edgeText();
  const alpha = level >= 3 ? 0.2 : 0.1;
  return (
    <div className="edge-layer">
      {[0, 1].map((side) => (
        <div key={side} style={{ position: 'absolute', top: 0, bottom: 0, width: fit.ox, left: side ? fit.ox + SCREEN_W * fit.scale : 0, overflow: 'hidden' }}>
          <div className="edge-names" style={{
            color: `rgba(110,130,170,${alpha})`, padding: '0 10px', textAlign: side ? 'left' : 'right',
            animation: store.settings.reduceMotion ? 'none' : `edge-scroll ${side ? 140 : 170}s linear infinite`,
          }}>
            {names + '\n' + names}
          </div>
        </div>
      ))}
    </div>
  );
}

let edgeCache = '';
function edgeText(): string {
  if (edgeCache) return edgeCache;
  const user = store.s?.user ?? '';
  const people = MILL_ROW.map((p) => `${p.surname} ${p.forename === '(infant)' ? user : p.forename}`.toUpperCase());
  const lines: string[] = [];
  for (let i = 0; i < 160; i++) {
    const p = people[i % people.length];
    lines.push(i % 7 === 3 ? `~unmatched\\rec_${String(412 + (i % 23) + 1).padStart(4, '0')}.dat` : `${p.padEnd(18)} 141.2  CONTINUED`);
  }
  edgeCache = lines.join('\n');
  return edgeCache;
}
