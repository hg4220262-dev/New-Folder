import { useEffect, useRef, useState } from 'react';
import { store, useStore } from '../../engine/state';
import { sfx } from '../../engine/bus';
import { toCrash } from '../../story/climax';
import { createShatter } from './shatter';
import { snapshot, channel, drawLeak, type Snap } from './leak';
import type { Fit } from '../Monitor';

/**
 * The climax. 1: everything stops responding. 2: the frozen screen leaks past the 4:3
 * edges into the black bars. 3: it shatters across the whole real screen. Then the stop error.
 */
export function Breakdown({ fit }: { fit: Fit }) {
  const s = useStore();
  const [stage, setStage] = useState<'none' | 'leak' | 'shatter'>('none');
  const c2d = useRef<HTMLCanvasElement>(null);
  const cgl = useRef<HTMLCanvasElement>(null);
  const snap = useRef<Snap | null>(null);
  const active = s?.phase === 'desktop' && s.glitch >= 5;
  const soft = store.settings.reduceFlashing;
  const still = store.settings.reduceMotion;
  // Quitting to the title mid-breakdown unwinds the stages, so the [stage] cleanups stop the loops.
  useEffect(() => { if (!active) setStage('none'); }, [active]);

  useEffect(() => {
    if (!active) return;
    let dead = false;
    store.s.busy = true;
    for (const w of store.s.windows) w.notResponding = true;
    store.bump();
    sfx('glitch');
    const beeps = setInterval(() => sfx(Math.random() < 0.5 ? 'error' : 'glitch'), 700);
    const t = setTimeout(async () => {
      clearInterval(beeps);
      // Capture the flat screen (no curved glass), so the shards have clean edges.
      store.ui.flatCapture = true; store.bump();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40))));
      const img = await snapshot(fit);
      store.ui.flatCapture = false; store.bump();
      if (dead) return;
      snap.current = { img, red: channel(img, 0), blue: channel(img, 2) };
      setStage('leak');
    }, soft ? 5000 : 3600);
    return () => { dead = true; clearTimeout(t); clearInterval(beeps); };
  }, [active]);

  useEffect(() => {
    if (stage !== 'leak' || !snap.current || !c2d.current) return;
    const c = c2d.current;
    const dpr = window.devicePixelRatio || 1;
    c.width = window.innerWidth * dpr; c.height = window.innerHeight * dpr;
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dur = soft ? 5200 : 3400;
    const t0 = performance.now();
    let raf = 0, frame = 0;
    const loop = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      if (frame++ % (soft ? 4 : 2) === 0) drawLeak(g, snap.current!, fit, t, soft, still);
      if (frame % 9 === 0) sfx('glitch');
      if (t < 1) raf = requestAnimationFrame(loop); else setStage('shatter');
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'shatter' || !snap.current || !cgl.current) return;
    const img = new Image();
    let raf = 0;
    let handle: ReturnType<typeof createShatter> = null;
    img.onload = () => {
      try { handle = createShatter(cgl.current!, img, fit, soft); } catch { handle = null; }
      if (!handle) { if (store.s.phase === 'desktop') toCrash(); return; }
      sfx('crash');
      const dur = soft ? 5200 : 3600;
      const t0 = performance.now();
      const loop = () => {
        const t = Math.min(1, (performance.now() - t0) / dur);
        handle!.draw(t);
        if (t < 1) raf = requestAnimationFrame(loop);
        else setTimeout(() => { setStage('none'); if (store.s.phase === 'desktop') toCrash(); }, 700);
      };
      raf = requestAnimationFrame(loop);
    };
    img.src = snap.current.img.toDataURL();
    return () => { cancelAnimationFrame(raf); handle?.dispose(); };
  }, [stage]);

  if (stage === 'none') return null;
  const full: React.CSSProperties = { position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 150000 };
  return (
    <>
      <canvas ref={c2d} style={{ ...full, display: stage === 'leak' ? 'block' : 'none' }} />
      <canvas ref={cgl} style={{ ...full, display: stage === 'shatter' ? 'block' : 'none' }} />
    </>
  );
}
