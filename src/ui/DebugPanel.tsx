import { useState } from 'react';
import { store, useStore } from '../engine/state';
import { setChapter } from '../engine/director';
import { climax } from '../story/climax';

/** Developer-only panel (launch with `npm run debug`, toggle with F9). */
export function DebugPanel() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  (window as any).__debugToggle = () => setOpen((v) => !v);
  if (!open || !s) return null;
  const btn = (label: string, f: () => void) => <button key={label} className="btn" style={{ minWidth: 0, margin: 2 }} onClick={f}>{label}</button>;
  return (
    <div style={{ position: 'fixed', right: 8, top: 8, zIndex: 300000, background: '#ece9d8', border: '1px solid #000', padding: 8, width: 260, fontFamily: 'var(--ui)', fontSize: 11, cursor: 'default' }}>
      <b>Debug</b> — phase {s.phase}, chapter {s.chapter}, glitch {s.glitch}, edge {s.edge}
      <div>{[1, 2, 3, 4, 5].map((c) => btn(`Ch ${c}`, () => { setChapter(c); store.bump(); }))}</div>
      <div>
        {btn('Reboot race', () => { s.flags.raceLosses = 0; s.flags.raceWon = false; s.windows = []; s.phase = 'reboot'; store.bump(); })}
        {btn('Show hidden', () => { s.opts.showHidden = true; s.opts.showSystem = true; store.bump(); })}
        {btn('Climax', () => climax('debug'))}
        {btn('Full', () => { s.screenMode = s.screenMode === 'full' ? 'boxed' : 'full'; store.bump(); })}
      </div>
      <div style={{ maxHeight: 160, overflow: 'auto', marginTop: 4 }}>fired: {s.fired.join(', ')}</div>
      <div>pending: {s.pending.map((p) => p.fx).join(', ')}</div>
    </div>
  );
}
