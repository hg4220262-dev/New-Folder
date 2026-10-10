import { store } from './state';

// The laptop's clock is frozen on Thursday 14 August 2008. Time passes from
// 09:12 at the player's real pace, so the clock still feels alive.
const START = new Date(2008, 7, 14, 9, 12, 0).getTime();

export function gameNow(): number {
  return START + (store.s?.playMs ?? 0);
}

const pad = (v: number) => String(v).padStart(2, '0');

export function fmtStamp(t: number): string {
  const d = new Date(t);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function stamp(): string { return fmtStamp(gameNow()); }

export function clockText(): string {
  const d = new Date(gameNow());
  const h = d.getHours() % 12 || 12;
  return `${h}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}
