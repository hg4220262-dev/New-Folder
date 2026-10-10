import { store } from '../../engine/state';
import { newState, runFx, WORLD_V } from '../../engine/director';
import { sfx } from '../../engine/bus';
import type { State, Slot } from '../../engine/state';
import '../../story/triggers';
import { PREVIOUS_NOTES } from '../../story/world_base';

declare global {
  interface Window {
    host?: {
      name: string; debug: boolean; safeTop?: number;
      capture: () => Promise<string | null>;
      leaveNote?: (p: { ending: string; name: string }) => Promise<string | null>;
      onFocus?: (cb: (focused: boolean) => void) => void;
      onSafeTop?: (cb: (px: number) => void) => void;
      quit: () => void;
    };
  }
}

export function hostName(): { user: string; full: string } {
  const full = (window.host?.name ?? 'User').trim() || 'User';
  const user = full.split(/\s+/)[0];
  return { user, full };
}

/** Title screen state (no save). */
export function titleState(): State {
  const { user, full } = hostName();
  const st = newState(user, full);
  st.phase = 'title';
  return st;
}

export function newGame(slot: Slot = store.slot) {
  const { user, full } = hostName();
  store.slot = slot;
  store.clearSave(slot);
  store.s = newState(user, full);
  store.s.phase = 'boot';
  store.bump();
  store.save();
}

export function continueGame(slot: Slot = store.slot) {
  store.slot = slot;
  const st = store.load(slot);
  if (!st) { newGame(slot); return; }
  migrate(st);
  store.s = st;
  st.busy = false;
  // A finished file reopens on its ending screen.
  if (st.ending) { st.phase = 'ending'; store.bump(); return; }
  // Always resume through the login screen so it feels like switching the laptop on again.
  if (st.phase === 'desktop' || st.phase === 'boot' || st.phase === 'login') st.phase = 'login';
  store.bump();
}

/**
 * A save made before files were added to the world gets them now: anything in a fresh world
 * that the save has never had (and the player has not emptied from the Recycle Bin) is added.
 */
export function migrate(st: State) {
  if ((st.flags.worldV ?? 1) >= WORLD_V) return;
  const fresh = newState(st.user, st.fullName).fs;
  const purged: string[] = st.flags.purged ?? [];
  for (const [id, n] of Object.entries(fresh)) {
    if (!st.fs[id] && !purged.includes(id) && n.parents.every((p) => st.fs[p] || fresh[p])) st.fs[id] = n;
  }
  // A save already past chapter 3 missed the fx that surfaces the three before; their notes.txt go in now.
  if (st.chapter >= 3 && st.fs.notes && !(st.fs.notes.versions ?? []).some((v) => v.author === 't.brandt')) st.fs.notes.versions = [...PREVIOUS_NOTES, ...(st.fs.notes.versions ?? [])];
  st.flags.worldV = WORLD_V;
}

export function enterDesktop() {
  const s = store.s;
  const first = !s.fired.includes('__entered');
  s.phase = 'desktop';
  sfx('logon');
  if (first) { s.fired.push('__entered'); runFx('ch1'); }
  store.bump();
  store.save();
}

const later = (ms: number, f: () => void) => setTimeout(f, ms);

/** Desktop drains to grey, then the Welcome screen shows a status line, like the real thing. */
export function leave(kind: 'logoff' | 'off' | 'restart') {
  const ui = store.ui;
  if (ui.leaving) return;
  store.save();
  ui.leaving = kind;
  ui.ask = null;
  store.ui.startOpen = false;
  store.bump();
  later(900, () => {
    ui.leaving = null;
    sfx('logoff');
    store.s.phase = 'login';
    store.s.windows = [];
    ui.loginStatus = 'Logging off...';
    store.bump();
    later(1400, () => { ui.loginStatus = 'Saving your settings...'; store.bump(); });
    later(2900, () => {
      if (kind === 'logoff') { ui.loginStatus = null; store.bump(); store.save(); return; }
      ui.loginStatus = kind === 'restart' ? 'Windows is restarting...' : 'Windows is shutting down...';
      store.bump();
      later(1800, () => {
        ui.loginStatus = null;
        store.s.phase = kind === 'restart' ? 'boot' : 'title';
        store.bump();
      });
    });
  });
}

/** Start menu buttons open the confirmation prompt first. */
export function logOff() { store.ui.ask = 'logoff'; store.ui.startOpen = false; store.bump(); }
export function turnOff() { store.ui.ask = 'off'; store.ui.startOpen = false; store.bump(); }
export function cancelAsk() { store.ui.ask = null; store.bump(); }
