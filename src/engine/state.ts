import { useSyncExternalStore } from 'react';
import type { FS } from './fs';
import type { Balloon, NodeId, Phase, Settings, Win } from './types';

export interface LogEntry {
  id: number;
  type: 'Information' | 'Warning' | 'Error';
  at: number;
  source: string;
  cat: string;
  ev: number;
  text: string;
  /** Shown instead of `text` until chapter 3, when the log "opens up". */
  vague?: string;
  log: 'Application' | 'System';
}
export interface Pending { fx: string; watch: NodeId[]; after: number }
export interface Timer { fx: string; at: number }

export interface State {
  saveVersion: 1;
  phase: Phase;
  fs: FS;
  flags: Record<string, any>;
  chapter: number;
  windows: Win[];
  z: number;
  balloons: Balloon[];
  log: LogEntry[];
  recent: NodeId[];
  opened: NodeId[];
  opts: { showHidden: boolean; showSystem: boolean; hideExt: boolean };
  user: string;
  fullName: string;
  shownUser: string;
  glitch: number;
  edge: number;
  suppress: string[];
  suggest: NodeId[];
  playMs: number;
  fired: string[];
  pending: Pending[];
  timers: Timer[];
  ending: string | null;
  busy: boolean;
  screenMode: 'boxed' | 'full';
  safeMode: boolean;
  /** Real time of the last save (shown on the file-select screen). */
  savedAt?: number;
  /** The Desktop note has been left for this playthrough. */
  noteLeft?: boolean;
}

export const DEFAULT_SETTINGS: Settings = { reduceFlashing: false, reduceMotion: false, volume: 0.7, deskNote: true };

/** Three save files, like a console game's file select. */
export const SLOTS = [0, 1, 2] as const;
export type Slot = (typeof SLOTS)[number];
const LEGACY_KEY = 'newfolder.save.v1';
const slotKey = (n: number) => `newfolder.save.v1.slot${n}`;
const SETTINGS_KEY = 'newfolder.settings.v1';
const ENDINGS_KEY = 'newfolder.endings.v1';

/** Every ending, in the order the endings list shows them. */
export const ALL_ENDINGS: [string, string][] = [
  ['signed_early', 'Signed off (early)'], ['signoff', 'Signed off'], ['restore', 'Restored'], ['leave', 'Left open'],
  ['disclose', 'Released'], ['drain', 'Emptied'], ['recorded', 'Recorded'], ['erase', 'Erased'],
];

/** Endings reached on this computer, across all three save files (including ones since erased). */
export function seenEndings(): string[] {
  let seen: string[] = [];
  try { seen = JSON.parse(localStorage.getItem(ENDINGS_KEY) ?? '[]'); } catch { seen = []; }
  for (const n of SLOTS) { const e = store.load(n)?.ending; if (e && !seen.includes(e)) seen.push(e); }
  return ALL_ENDINGS.map(([id]) => id).filter((id) => seen.includes(id));
}

export function markEnding(id: string) {
  const seen = seenEndings();
  if (!seen.includes(id)) seen.push(id);
  try { localStorage.setItem(ENDINGS_KEY, JSON.stringify(seen)); } catch { /* ignore */ }
}

/** What the file-select screen shows for a slot (read without loading the save). */
export interface SlotInfo { slot: Slot; chapter: number; playMs: number; user: string; ending: string | null; savedAt: number }

class Store {
  s: State = null as unknown as State;
  settings: Settings = loadSettings();
  /** Transient UI-only state (not saved). */
  ui = {
    startOpen: false, menu: null as null | { x: number; y: number; items: MenuItem[] }, pause: false,
    flash: 0, jitter: 0, split: 0, tearAt: 0, leakFlash: false,
    /** Desktop is fading to grey before log off / shut down. */
    leaving: null as null | 'logoff' | 'off' | 'restart',
    /** The "Turn off computer" / "Log Off Windows" prompt over the greyed desktop. */
    ask: null as null | 'logoff' | 'off',
    /** Status line shown on the Welcome screen ("Logging off...", etc). */
    loginStatus: null as null | string,
    /** CRT overlay and warp are dropped while the screen is captured for the shatter. */
    flatCapture: false,
    /** Opens still waiting on the old machine (the cursor is an hourglass while > 0). */
    wait: 0,
  };
  private ver = 0;
  private listeners = new Set<() => void>();
  private queued = false;
  private lastSave = 0;

  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  getVersion = () => this.ver;

  bump() {
    this.ver++;
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      this.listeners.forEach((l) => l());
      const now = Date.now();
      if (now - this.lastSave > 1500) { this.lastSave = now; this.save(); }
    });
  }

  /** The save file currently being played. */
  slot: Slot = 0;

  save() {
    if (!this.s || this.s.phase === 'title') return;
    this.s.savedAt = Date.now();
    try { localStorage.setItem(slotKey(this.slot), JSON.stringify(this.s)); } catch { /* storage full or unavailable */ }
  }
  /** The old single save becomes File 1 the first time the new build runs. */
  migrate() {
    try {
      const old = localStorage.getItem(LEGACY_KEY);
      if (old && !localStorage.getItem(slotKey(0))) localStorage.setItem(slotKey(0), old);
      if (old) localStorage.removeItem(LEGACY_KEY);
    } catch { /* ignore */ }
  }
  hasSave(slot: Slot = this.slot): boolean {
    try { return !!localStorage.getItem(slotKey(slot)); } catch { return false; }
  }
  load(slot: Slot = this.slot): State | null {
    try {
      const raw = localStorage.getItem(slotKey(slot));
      if (!raw) return null;
      const st = JSON.parse(raw) as State;
      return st.saveVersion === 1 ? st : null;
    } catch { return null; }
  }
  slotInfo(slot: Slot): SlotInfo | null {
    const st = this.load(slot);
    if (!st) return null;
    return { slot, chapter: st.chapter ?? 1, playMs: st.playMs ?? 0, user: st.shownUser ?? st.user ?? '', ending: st.ending ?? null, savedAt: st.savedAt ?? 0 };
  }
  clearSave(slot: Slot = this.slot) { try { localStorage.removeItem(slotKey(slot)); } catch { /* ignore */ } }
  copySave(from: Slot, to: Slot) {
    try { const raw = localStorage.getItem(slotKey(from)); if (raw) localStorage.setItem(slotKey(to), raw); } catch { /* ignore */ }
  }
  saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ }
    this.bump();
  }
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const prm = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const base = { ...DEFAULT_SETTINGS, reduceMotion: prm };
    return raw ? { ...base, ...JSON.parse(raw) } : base;
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export interface MenuItem {
  label?: string;
  bold?: boolean;
  disabled?: boolean;
  checked?: boolean;
  sep?: boolean;
  run?: () => void;
  sub?: MenuItem[];
}

export const store = new Store();

export function useStore(): State {
  useSyncExternalStore(store.subscribe, store.getVersion);
  return store.s;
}
