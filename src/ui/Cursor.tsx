import { useEffect, useRef, useState } from 'react';
import { bindCursor, onPointerMove } from './pointer';
import { store, useStore } from '../engine/state';

type Kind = 'arrow' | 'text' | 'busy' | 'hand' | 'start';

/** "App starting" cursor for a moment after any window opens, like the real shell. */
let startingUntil = 0;
let lastCount = 0;
function markStarting(ms = 700) { startingUntil = performance.now() + ms; }

const ARROW = 'M1.5 1.5v18.2l4.3-4.2 3.1 7.1 2.9-1.3-3-6.9h6.1z';

const Arrow = () => <path d={ARROW} fill="#fff" stroke="#000" strokeWidth="1" strokeLinejoin="round" />;

/** Hourglass that slowly turns over, original art. */
const Glass = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="hg">
      <path d="M0.5 0.5h11v2h-1c0 3.2-3.4 4.2-3.4 5.5s3.4 2.3 3.4 5.5h1v2h-11v-2h1c0-3.2 3.4-4.2 3.4-5.5S1.5 5.7 1.5 2.5h-1z" fill="#fff" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      <path className="sand-top" d="M3 3.5h6c-.4 1.8-2.4 2.6-3 3.6-.6-1-2.6-1.8-3-3.6z" fill="#3a63c8" />
      <path className="sand-bot" d="M2.8 13.2c.4-1.9 2.5-2.7 3.2-3.8.7 1.1 2.8 1.9 3.2 3.8z" fill="#3a63c8" />
    </g>
  </g>
);

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [kind, setKind] = useState<Kind>('arrow');
  const s = useStore();
  useEffect(() => { bindCursor(ref.current); }, []);
  const pick = () => {
    const t = document.querySelectorAll(':hover');
    const last = t[t.length - 1] as HTMLElement | undefined;
    let k: Kind = 'arrow';
    const ph = store.s?.phase;
    if ((store.s?.busy || store.ui.wait > 0) && (ph === 'desktop' || ph === 'login')) k = 'busy';
    else if (performance.now() < startingUntil) k = 'start';
    else if (last?.closest('textarea, input[type=text], input:not([type]), .selectable')) k = 'text';
    else if (last?.closest('.tp-link, a, .hand')) k = 'hand';
    setKind((p) => (p === k ? p : k));
  };
  useEffect(() => onPointerMove(pick), []);
  // Opening a window shows the app-starting cursor briefly.
  const count = s?.windows?.length ?? 0;
  useEffect(() => {
    if (count > lastCount) {
      lastCount = count;
      markStarting();
      pick();
      const t = setTimeout(pick, 760);
      return () => clearTimeout(t);
    }
    lastCount = count;
    pick();
  }, [count, s?.busy]);
  // The hourglass goes up the moment something is opened, and comes down when it appears.
  const waiting = store.ui.wait > 0;
  useEffect(() => { pick(); }, [waiting]);
  // A new screen replaces whatever was under the pointer.
  useEffect(() => { const t = setTimeout(pick, 30); return () => clearTimeout(t); }, [s?.phase]);
  return (
    <div ref={ref} className={`cursor k-${kind}`} style={s?.phase === 'crash' ? { visibility: 'hidden' } : undefined}>
      {(kind === 'arrow' || kind === 'start') && (
        <svg width="32" height="32" viewBox="0 0 32 32">
          <Arrow />
          {kind === 'start' && <Glass x={12} y={12} s={0.82} />}
        </svg>
      )}
      {kind === 'hand' && (
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'translate(-6px,0)' }}>
          <path d="M7 1.5c1 0 2 .8 2 2V12l1-.3c1-.3 2 .2 2.3 1l.4-.2c1-.3 2 .2 2.3 1l.4-.1c1.1-.3 2.2.4 2.4 1.5l.6 4c.4 3-.6 5.5-2.4 7.5H8.5L3 17.5c-.8-1-.5-2.3.5-2.8.8-.4 1.8-.2 2.4.5L5 13.8V3.5c0-1.2.8-2 2-2z" fill="#fff" stroke="#000" strokeLinejoin="round" />
          <path d="M9.2 12.5v5M12.6 13.2v4.4M15.9 14.4v3.4" stroke="#000" strokeWidth="0.8" />
        </svg>
      )}
      {kind === 'text' && (
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'translate(-4px,-8px)' }}>
          <path d="M1.5 1.5h3l1 1 1-1h3M6 2.5v13M1.5 16.5h3l1-1 1 1h3" fill="none" stroke="#fff" strokeWidth="3" />
          <path d="M1.5 1.5h3l1 1 1-1h3M6 2.5v13M1.5 16.5h3l1-1 1 1h3" fill="none" stroke="#000" strokeWidth="1.2" />
        </svg>
      )}
      {kind === 'busy' && (
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'translate(-6px,-8px)' }}>
          <Glass x={0} y={0} s={1.15} />
        </svg>
      )}
    </div>
  );
}
