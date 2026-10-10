import { useEffect } from 'react';
import { store, useStore } from '../engine/state';
import { tick } from '../engine/director';
import { Monitor, EdgeLayer, useFit } from './Monitor';
import { Cursor } from './Cursor';
import { Desktop } from './shell/Desktop';
import { Title } from './screens/Title';
import { Boot, Login } from './screens/Boot';
import { Crash, Reboot } from './screens/Crash';
import { Recovery } from './screens/Recovery';
import { Ending } from './screens/Ending';
import { Pause } from './screens/Pause';
import { Breakdown } from './fx/Breakdown';
import { GlitchDefs, TearBand, useAmbientGlitch } from './fx/Glitch';
import { DebugPanel } from './DebugPanel';
import { CrtDefs } from './fx/crt';
import { IconDefs } from './icons';
import { updateHum } from './audio';
import { openApp } from '../engine/actions';
import { closeWin, topWin } from '../engine/windows';

function useMainLoop() {
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      tick(Math.min(1000, now - last));
      last = now;
      const s = store.s;
      updateHum(s?.glitch ?? 0, s?.phase === 'desktop' && !store.ui.pause);
    }, 250);
    return () => clearInterval(id);
  }, []);
}

/** Switching to another app pauses the game, the way full-screen games do. */
function usePauseOnBlur() {
  useEffect(() => {
    // Only pause after the window has been away for a moment, so a stray click elsewhere
    // or a notification does not throw up the pause menu.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const pause = () => {
      timer = null;
      const s = store.s;
      if (!s || store.ui.pause || store.ui.leaving || store.settings.pauseOnBlur === false) return;
      if (PAUSABLE.includes(s.phase)) { store.ui.pause = true; store.bump(); store.save(); }
    };
    const away = () => { if (!timer) timer = setTimeout(pause, 1500); };
    const back = () => { if (timer) { clearTimeout(timer); timer = null; } };
    window.host?.onFocus?.((focused) => { if (focused) back(); else away(); });
    // Browser fallback for `npm run dev`.
    const onVis = () => { if (document.hidden) away(); else back(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
}

function useKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = store.s;
      if (e.key === 'Escape' && !(e.ctrlKey && e.shiftKey)) {
        if (store.ui.menu) { store.ui.menu = null; store.bump(); return; }
        if (PAUSABLE.includes(s.phase)) { store.ui.pause = !store.ui.pause; store.bump(); }
        return;
      }
      if (e.key === 'F9' && window.host?.debug) { (window as any).__debugToggle?.(); return; }
      if (s.phase !== 'desktop' || store.ui.pause) return;
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea');
      // Win+R style shortcut: Ctrl+R opens Run.
      if (e.ctrlKey && e.key.toLowerCase() === 'r' && !typing) { e.preventDefault(); openApp('app:run'); }
      // Ctrl+Shift+Esc: Task Manager.
      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') openApp('app:taskmgr');
      // Alt+F4 / Ctrl+W: close the active window.
      if ((e.altKey && e.key === 'F4') || (e.ctrlKey && e.key.toLowerCase() === 'w' && !typing)) {
        const w = topWin();
        if (w) { e.preventDefault(); closeWin(w.id); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function Screen() {
  const s = useStore();
  switch (s.phase) {
    case 'title': return <Title />;
    case 'boot': return <Boot />;
    case 'login': return <Login />;
    case 'desktop': return <Desktop />;
    case 'crash': return <Crash />;
    case 'reboot': return <Reboot />;
    case 'recovery': return <Recovery />;
    case 'ending': return <Ending />;
  }
}

/** Phases that can be paused (the reboot race's countdown freezes too). */
const PAUSABLE: string[] = ['desktop', 'reboot', 'recovery'];

export function App() {
  const s = useStore();
  const fit = useFit();
  useMainLoop();
  useKeys();
  usePauseOnBlur();
  useAmbientGlitch();
  useEffect(() => {
    // Full-width phases ignore the 4:3 frame entirely.
    // The red ending keeps the full window too: no bars, no glass.
    const full = ['crash', 'reboot', 'recovery'].includes(s.phase) || (s.phase === 'ending' && s.ending === 'erase');
    if (full && s.screenMode !== 'full') { s.screenMode = 'full'; store.bump(); }
    if (!full && s.phase !== 'desktop' && s.screenMode === 'full') { s.screenMode = 'boxed'; store.bump(); }
  }, [s.phase]);
  const cls = [
    store.ui.split ? 'g-split' : '',
    store.ui.jitter ? 'g-jitter' : '',
    s.glitch >= 2 ? 'g-trail' : '',
  ].join(' ');
  return (
    <div className={`void ${store.settings.reduceMotion ? 'still' : ''}`}>
      <GlitchDefs />
      <CrtDefs />
      <IconDefs />
      <EdgeLayer fit={fit} />
      {store.ui.leakFlash && fit.ox > 0 && s.phase === 'desktop' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2,
          background: `linear-gradient(90deg, rgba(40,80,200,0.18), transparent ${fit.ox}px, transparent calc(100% - ${fit.ox}px), rgba(40,80,200,0.18))` }} />
      )}
      <Monitor fit={fit} className={cls}>
        <Screen />
        <TearBand />
      </Monitor>
      <Breakdown fit={fit} />
      <Pause />
      <Cursor />
      {window.host?.debug && <DebugPanel />}
    </div>
  );
}
