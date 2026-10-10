import { store } from './state';
import type { AppKind, Win } from './types';
import { SCREEN_H, SCREEN_W } from '../brand';

let seq = 1;

/** Pixels at the top of the real display hidden by a camera notch (set by the UI). */
export const display = { safeTop: 0 };

export function screenWidth(): number {
  return store.s?.screenMode === 'full' ? Math.round(window.innerWidth / Math.max(0.1, (window.innerHeight - display.safeTop) / SCREEN_H)) : SCREEN_W;
}

const SIZES: Partial<Record<AppKind, [number, number]>> = {
  explorer: [640, 460], notepad: [520, 400], wordpad: [600, 500], image: [600, 500], mail: [560, 440],
  sheet: [680, 460], cmd: [620, 380], events: [700, 440], props: [362, 440], taskmgr: [420, 440],
  folderopts: [380, 420], run: [360, 180], about: [380, 300], ie: [760, 520], console: [520, 430], joiner: [560, 330], linkterm: [620, 400],
};

export function openWin(p: Partial<Win> & { app: AppKind; title: string }): Win {
  const s = store.s;
  const [dw, dh] = SIZES[p.app] ?? [500, 400];
  const n = s.windows.filter((w) => !w.min).length;
  const sw = screenWidth();
  const w = Math.min(p.w ?? dw, sw - 20);
  const h = Math.min(p.h ?? dh, 768 - 50);
  const cx = p.app === 'dialog' || p.app === 'props' || p.app === 'folderopts' || p.app === 'run';
  const win: Win = {
    id: `w${Date.now().toString(36)}${seq++}`,
    x: cx ? Math.round((sw - w) / 2) + (n % 4) * 12 : 40 + (n % 8) * 26,
    y: cx ? Math.round((738 - h) / 2.4) : 20 + (n % 8) * 24,
    w, h, z: ++s.z,
    ...p,
  } as Win;
  s.windows.push(win);
  store.ui.startOpen = false;
  store.bump();
  return win;
}

export function getWin(id: string): Win | undefined {
  return store.s.windows.find((w) => w.id === id);
}

export function focusWin(id: string) {
  const w = getWin(id);
  if (!w) return;
  w.min = false;
  if (w.z !== store.s.z) w.z = ++store.s.z;
  store.ui.startOpen = false;
  store.bump();
}

export function closeWin(id: string) {
  store.s.windows = store.s.windows.filter((w) => w.id !== id);
  store.bump();
}

export function minimizeWin(id: string) {
  const w = getWin(id);
  if (w) { w.min = true; store.bump(); }
}

export function toggleMax(id: string) {
  const w = getWin(id);
  if (w && w.app !== 'dialog' && w.app !== 'props') { w.max = !w.max; store.bump(); }
}

export function topWin(): Win | undefined {
  let best: Win | undefined;
  for (const w of store.s.windows) if (!w.min && (!best || w.z > best.z)) best = w;
  return best;
}

export function dialog(title: string, text: string, icon: 'info' | 'warn' | 'error' | 'question' = 'info', buttons = ['OK'], action?: string, bySystem = false) {
  return openWin({ app: 'dialog', title, dialog: { title, text, icon, buttons, action }, bySystem, w: 380, h: 0 });
}
