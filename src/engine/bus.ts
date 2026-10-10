import type { GameEvent } from './types';

type Handler = (e: GameEvent) => void;
const handlers: Handler[] = [];

/** The story director subscribes here; the UI emits player actions. */
export function onGameEvent(h: Handler) { handlers.push(h); }
export function emit(e: GameEvent) { for (const h of handlers) h(e); }

type SfxName = 'click' | 'ding' | 'error' | 'balloon' | 'startup' | 'logon' | 'logoff' | 'recycle' | 'glitch' | 'crash' | 'type' | 'hddseek' | 'beep';
type SfxHandler = (n: SfxName) => void;
let sfxHandler: SfxHandler = () => {};
export function setSfx(h: SfxHandler) { sfxHandler = h; }
export function sfx(n: SfxName) { sfxHandler(n); }
export type { SfxName };
