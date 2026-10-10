import { store } from '../engine/state';
import type { State } from '../engine/state';
import { sfx } from '../engine/bus';
import { MILL_ROW, PUPILS } from './people';
import { chooseEnding } from './climax';

/**
 * The hand removal. In Safe Mode the Continuity Service is not running, so nothing stops the
 * reviewer opening ~unmatched and removing the 23 records one at a time, each by typing its
 * name. It is offered only once the reviewer has Kell's joined draft (the names) and has seen
 * their own name in the school register. After 12 the operation cannot be cancelled.
 * Record 23 is the reviewer.
 */
export const POINT_OF_NO_RETURN = 12;
export const TOTAL = 23;

export interface Rec { no: number; file: string; surname: string; forename: string; age: number; pupil: boolean }

export function records(s: State): Rec[] {
  return MILL_ROW.map((p, i) => ({
    no: i + 1,
    file: `rec_${String(413 + i).padStart(4, '0')}.dat`,
    surname: p.surname,
    forename: p.forename === '(infant)' ? s.user : p.forename,
    age: p.age,
    pupil: PUPILS.includes(`${p.surname}, ${p.forename}`) || (p.forename === '(infant)' && !!s.flags.youInRegister),
  }));
}

export const eraseEligible = (s: State): boolean => !!(s.flags.assembledKell && s.flags.sawSelf);
export const eraseCount = (s: State): number => s.flags.eraseCount ?? 0;
/** Past record 12 and not finished: the folder cannot be closed and nothing else on the screen responds. */
export const eraseLocked = (s: State): boolean => eraseCount(s) >= POINT_OF_NO_RETURN && eraseCount(s) < TOTAL && !s.ending;

const norm = (t: string) => t.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
/** "Ann Pryce", "Pryce Ann" and "Pryce, Ann" all name the record; case does not matter. */
export function matchesName(typed: string, r: Rec): boolean {
  const t = norm(typed), f = norm(r.forename), sn = norm(r.surname);
  return t === `${f} ${sn}` || t === `${sn} ${f}`;
}

/** What the service writes after record n is removed. It is not running. It writes anyway. */
export function serviceLine(n: number, s: State): string {
  const rs = records(s);
  const r = rs[n - 1];
  const left = TOTAL - n;
  const pupils = rs.slice(n).filter((x) => x.pupil).length;
  const who = `${r.surname}, ${r.forename}, ${r.age}`;
  const reg = `Register: ${pupils} pupil${pupils === 1 ? '' : 's'} present.`;
  const cont = `Continued: ${left}.`;
  switch (n) {
    case 1: return `Record 1 of ${TOTAL} removed (${who}). ${cont} Service status: not running.`;
    case 2: return `Record 2 removed (${who}). Journal write: FAILED (Safe Mode). ${cont}`;
    case 5: return `Record 5 removed (${who}). Option A: delete 23 records ....... REJECTED (records would end). Suggest: stop at 5.`;
    case 7: return `Record 7 removed (${who}). Suggest: stop at 7. (${left} records can still be Continued)`;
    case 10: return `Record 10 removed (${who}). Suggest: stop at 10. (Register: ${pupils} pupils present)`;
    case 11: return `Record 11 removed (${who}). Suggest: stop at 11. (after 12, Cancel is not available)`;
    case 12: return `Record 12 removed (${who}). Cancel: not available. NOTE  The service cannot stop the reviewer.`;
    case 22: return `Record 22 removed (${who}). Record 23: ${rs[22].file}, Dunmore, ${rs[22].forename}, ${rs[22].age} (resolved 14/08/2008 03:12, nearest candidate).`;
    default: return r.pupil ? `Record ${n} removed (${who}). ${reg}` : `Record ${n} removed (${who}). ${cont}`;
  }
}

/** Remove the next record if the typed name is its name. The 23rd removal ends the story. */
export function removeNext(typed: string): { ok: boolean; done?: boolean } {
  const s = store.s;
  const n = eraseCount(s);
  if (n >= TOTAL || !eraseEligible(s)) return { ok: false };
  if (!matchesName(typed, records(s)[n])) { sfx('error'); return { ok: false }; }
  s.flags.eraseCount = n + 1;
  if (n + 1 === TOTAL) { sfx('crash'); chooseEnding('erase'); return { ok: true, done: true }; }
  sfx(n + 1 === POINT_OF_NO_RETURN ? 'error' : 'recycle');
  store.bump();
  store.save();
  return { ok: true };
}
