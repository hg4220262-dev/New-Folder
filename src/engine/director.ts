import { store, type State, type LogEntry } from './state';
import { onGameEvent, sfx } from './bus';
import { onScreen } from './visibility';
import { stamp, gameNow } from './clock';
import type { Balloon, FNode, GameEvent, NodeId, Version } from './types';
import { buildWorld, seedLog, logEntry, HRS_VAGUE } from '../story/world';

export type Fx = (s: State) => void;
const FX: Record<string, Fx> = {};
export function defineFx(map: Record<string, Fx>) { Object.assign(FX, map); }

type Handler = (s: State, e: GameEvent) => void;
const handlers: Handler[] = [];
export function onStory(h: Handler) { handlers.push(h); }

/** Bumped whenever new files are added to the world, so older saves can pick them up. */
export const WORLD_V = 4;

export function newState(user: string, full: string): State {
  return {
    saveVersion: 1, phase: 'boot', fs: buildWorld(user, full), flags: { jl: [], worldV: WORLD_V }, chapter: 1,
    windows: [], z: 10, balloons: [], log: seedLog(), recent: [], opened: [],
    opts: { showHidden: false, showSystem: false, hideExt: true },
    user, fullName: full, shownUser: user, glitch: 0, edge: 0, suppress: [], suggest: [],
    playMs: 0, fired: [], pending: [], timers: [], ending: null,
    busy: false, screenMode: 'boxed', safeMode: false,
  };
}

export function runFx(id: string) {
  const f = FX[id];
  if (!f) { console.warn('unknown fx', id); return; }
  f(store.s);
  store.bump();
}

/** Run once only. */
export function once(id: string): boolean {
  const s = store.s;
  if (s.fired.includes(id)) return false;
  s.fired.push(id);
  runFx(id);
  return true;
}
export const fired = (id: string) => store.s.fired.includes(id);

/** Run `fx` once the watched nodes have been off-screen for `ms` (changes happen while nobody is looking). */
export function whenUnseen(fx: string, watch: NodeId[], ms = 1500) {
  const s = store.s;
  if (s.fired.includes(fx) || s.pending.some((p) => p.fx === fx)) return;
  s.pending.push({ fx, watch, after: ms });
}

export function after(fx: string, ms: number) {
  const s = store.s;
  if (s.fired.includes(fx) || s.timers.some((t) => t.fx === fx)) return;
  s.timers.push({ fx, at: s.playMs + ms });
}

const unseenSince: Record<string, number> = {};

export function tick(dt: number) {
  const s = store.s;
  if (!s || s.phase !== 'desktop' || store.ui.pause) return;
  s.playMs += dt;
  for (const t of [...s.timers]) {
    if (s.playMs >= t.at) {
      s.timers = s.timers.filter((x) => x !== t);
      once(t.fx);
    }
  }
  for (const p of [...s.pending]) {
    const seen = p.watch.some((id) => onScreen(id));
    if (seen) { delete unseenSince[p.fx]; continue; }
    unseenSince[p.fx] ??= s.playMs;
    if (s.playMs - unseenSince[p.fx] >= p.after) {
      s.pending = s.pending.filter((x) => x !== p);
      delete unseenSince[p.fx];
      once(p.fx);
    }
  }
  s.balloons = s.balloons.filter((b) => s.playMs - b.at < 12000);
  for (const h of handlers) h(s, { t: 'tick' });
  store.bump();
}

onGameEvent((e) => {
  const s = store.s;
  if (!s || s.phase !== 'desktop') return;
  for (const h of handlers) h(s, e);
  store.bump();
});

// ---------- helpers used by the story ----------

export function balloon(title: string, text: string, open?: NodeId, leak = false) {
  const s = store.s;
  const b: Balloon = { id: `b${s.playMs}${Math.random()}`, title, text, open, at: s.playMs, leak };
  s.balloons = [b];
  sfx('balloon');
}

export function addLog(p: Omit<LogEntry, 'id' | 'ev' | 'cat' | 'log' | 'at'> & Partial<LogEntry>) {
  const s = store.s;
  s.log.push(logEntry({ at: gameNow(), id: s.log.reduce((m, e) => Math.max(m, e.id), 0) + 1, ...p }));
}

export function hrsLog(text: string, type: LogEntry['type'] = 'Information') {
  addLog({ type, source: 'HRSCont', text, vague: HRS_VAGUE });
}

export function journalLine(text: string, at = stamp()) {
  const s = store.s;
  const [first, ...rest] = text.split('\n');
  s.flags.jl.push(`${at.padEnd(16)}  ${first}`, ...rest.map((r) => `                  ${r}`));
}

/** Rewrite a file and leave a trace in its Record History. */
export function rewrite(id: NodeId, patch: Partial<FNode>, note: string, author = 'SYSTEM', when = stamp()) {
  const n = store.s.fs[id];
  if (!n) return;
  const v: Version = { date: when, author, note, content: n.content, name: n.name };
  n.versions = [...(n.versions ?? []), v];
  Object.assign(n, patch);
}

/** Advance to a chapter, running every intermediate chapter's beats in order. */
export function setChapter(ch: number) {
  const s = store.s;
  while (s.chapter < ch) {
    s.chapter++;
    runFx(`ch${s.chapter}`);
  }
}
