import { store, markEnding } from '../engine/state';
import { sfx } from '../engine/bus';
import { hrsLog, journalLine } from '../engine/director';
import { TRIES, type BootOpt } from './race';

/**
 * The climax: screen-level breakdown -> stop error -> reboot race (see race.ts) -> recovery.
 * The visual sequence lives in ui/fx/Breakdown.tsx; this drives the phase.
 */
export function climax(cause: string) {
  const s = store.s;
  if (s.phase !== 'desktop' || s.flags.climax) return;
  s.flags.climax = cause;
  hrsLog('PRESERVE_RECORD_CONTINUITY could not be satisfied.', 'Error');
  journalLine(`Cause: ${cause}. The record is ending.\nHold on to it.`);
  s.glitch = 5;
  store.bump();
  // Breakdown.tsx watches glitch=5 and runs the visual shatter, then sets phase to 'crash'.
}

export function toCrash() {
  const s = store.s;
  s.phase = 'crash';
  s.screenMode = 'full';
  s.windows = [];
  s.balloons = [];
  sfx('crash');
  store.bump();
}

export function toReboot() {
  store.s.phase = 'reboot';
  store.bump();
}

export function toRecovery() {
  const s = store.s;
  s.phase = 'recovery';
  s.busy = false;
  s.glitch = 0;
  s.edge = 0;
  store.bump();
}

/**
 * The player's pick on the recovery menu (null: the countdown ran out and the assistant
 * picked). Only plain Safe Mode starts without the service. Anything else costs a try.
 */
export function bootChoice(opt: BootOpt | null): 'win' | 'retry' | 'lost' {
  const s = store.s;
  if (opt === 'safe') {
    s.safeMode = true;
    s.flags.raceWon = true;
    store.save();
    return 'win';
  }
  s.safeMode = false;
  s.flags.raceLosses = Math.min(TRIES, (s.flags.raceLosses ?? 0) + 1);
  store.save();
  return s.flags.raceLosses >= TRIES ? 'lost' : 'retry';
}

/** Three tries lost: Windows starts normally, the service with it, and Record 23 is finished. */
export function assistantWins() { finish('recorded'); }

/** The player signs off before learning anything (chapters 1-3). */
export function earlyEnding() { finish('signed_early'); }

export type EndingId = 'signoff' | 'restore' | 'leave' | 'signed_early' | 'disclose' | 'drain' | 'recorded';

export function chooseEnding(id: EndingId) { finish(id); }

function finish(id: EndingId) {
  const s = store.s;
  s.ending = id;
  markEnding(id);
  s.phase = 'ending';
  s.busy = false;
  store.bump();
  store.save();
  // Once per playthrough, the story leaves something behind on the real Desktop.
  if (!s.noteLeft && store.settings.deskNote !== false && typeof window !== 'undefined' && window.host?.leaveNote) {
    s.noteLeft = true;
    store.save();
    window.host.leaveNote({ ending: id, name: s.user }).catch(() => null);
  }
}
