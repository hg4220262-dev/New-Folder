import { useEffect } from 'react';
import { store, useStore } from '../../engine/state';
import { sfx } from '../../engine/bus';
import { topWin } from '../../engine/windows';
import { ptr } from '../pointer';

/** SVG filter used for chromatic splitting. */
export function GlitchDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="rgbsplit" x="0" y="0" width="100%" height="100%">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx="-3" result="r2" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx="3" result="b2" />
        <feBlend in="r2" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b2" mode="screen" />
      </filter>
    </svg>
  );
}

const wait = (lvl: number) => {
  if (lvl <= 1) return 35_000 + Math.random() * 40_000;
  if (lvl === 2) return 14_000 + Math.random() * 20_000;
  if (lvl === 3) return 6_000 + Math.random() * 8_000;
  return 2_500 + Math.random() * 3_000;
};

/** Ambient, escalating glitches for chapters 3-5. Each one is brief. */
export function useAmbientGlitch() {
  const s = useStore();
  const lvl = s?.phase === 'desktop' ? s.glitch : 0;
  useEffect(() => {
    if (lvl < 1 || lvl >= 5) return;
    let t: ReturnType<typeof setTimeout>;
    const fire = () => {
      const ui = store.ui;
      const soft = store.settings.reduceFlashing, still = store.settings.reduceMotion;
      const roll = Math.random();
      // Things that move under the cursor or eat clicks wait until the player's hand is still.
      const handBusy = performance.now() - ptr.lastInput < 2500;
      if (lvl >= 1 && roll < 0.5) { ui.leakFlash = true; store.bump(); setTimeout(() => { ui.leakFlash = false; store.bump(); }, lvl >= 3 ? 260 : 90); }
      if (lvl >= 2 && !soft && roll > 0.3) { ui.split = 1; store.bump(); setTimeout(() => { ui.split = 0; store.bump(); }, 70 + lvl * 30); }
      if (lvl >= 2 && !still && roll > 0.55) { ui.jitter = 1; store.bump(); setTimeout(() => { ui.jitter = 0; store.bump(); }, 120 + lvl * 60); }
      if (lvl >= 3) {
        ui.tearAt = Math.random() * 700;
        store.bump();
        setTimeout(() => { ui.tearAt = 0; store.bump(); }, 140);
        sfx('glitch');
        const others = store.s.windows.filter((x) => x !== topWin() && !x.min);
        const w = others[Math.floor(Math.random() * others.length)];
        if (w && !handBusy && Math.random() < 0.4) { w.notResponding = true; store.bump(); setTimeout(() => { w.notResponding = false; store.bump(); }, 1800); }
      }
      if (lvl >= 2 && !handBusy && Math.random() < 0.35) { store.s.flags.shuffle = (store.s.flags.shuffle ?? 0) + 1; store.bump(); }
      if (lvl === 2 && Math.random() < 0.25) sfx('hddseek');
      t = setTimeout(fire, wait(lvl));
    };
    t = setTimeout(fire, wait(lvl) * 0.5);
    return () => clearTimeout(t);
  }, [lvl]);
}

/** A horizontal tear band drawn over the monitor. */
export function TearBand() {
  useStore();
  const y = store.ui.tearAt;
  if (!y) return null;
  return (
    <div style={{
      position: 'absolute', left: -40, right: -40, top: y, height: 6 + Math.random() * 26, zIndex: 99990, pointerEvents: 'none',
      backdropFilter: 'hue-rotate(160deg) contrast(1.6) brightness(1.2)', transform: `translateX(${(Math.random() - 0.5) * 40}px)`,
    }} />
  );
}
