import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => { mem.set(k, String(v)); },
  removeItem: (k: string) => { mem.delete(k); },
};
(globalThis as any).window = (globalThis as any).window ?? { innerWidth: 1440, innerHeight: 900 };

const { store } = await import('../src/engine/state');
const { newState } = await import('../src/engine/director');
const { emit } = await import('../src/engine/bus');
await import('../src/story/triggers');
const E = await import('../src/story/erase');
const { leaveNote } = createRequire(import.meta.url)('../electron/note.cjs');

beforeEach(() => {
  mem.clear();
  store.slot = 0;
  store.s = newState('Reona', 'Reona Monga');
  store.s.phase = 'recovery';
  store.s.safeMode = true;
});

const typeAll = (upto: number) => {
  for (let i = E.eraseCount(store.s); i < upto; i++) {
    const r = E.records(store.s)[i];
    expect(E.removeNext(`${r.forename} ${r.surname}`).ok).toBe(true);
  }
};

describe('hand removal', () => {
  it("is offered only with Kell's draft joined and the reviewer's own name seen on the register", () => {
    expect(E.eraseEligible(store.s)).toBe(false);
    store.s.flags.assembledKell = true;
    expect(E.eraseEligible(store.s)).toBe(false);
    store.s.flags.youInRegister = true;
    store.s.phase = 'desktop';
    emit({ t: 'open', id: 'regp2' });
    store.s.phase = 'recovery';
    expect(store.s.flags.sawSelf).toBe(true);
    expect(E.eraseEligible(store.s)).toBe(true);
    expect(E.removeNext('Ann Pryce').ok).toBe(true);
  });

  it('refuses without eligibility and refuses a wrong or out-of-order name', () => {
    expect(E.removeNext('Ann Pryce').ok).toBe(false);
    Object.assign(store.s.flags, { assembledKell: true, sawSelf: true });
    expect(E.removeNext('Thomas Pryce').ok).toBe(false);
    expect(E.removeNext('Ann Price').ok).toBe(false);
    expect(E.eraseCount(store.s)).toBe(0);
  });

  it('accepts either name order and any case', () => {
    const r = E.records(store.s)[0];
    for (const t of ['Ann Pryce', 'PRYCE, ANN', 'pryce ann', '  Ann   Pryce ']) expect(E.matchesName(t, r)).toBe(true);
    expect(E.matchesName('Ann', r)).toBe(false);
  });

  it('cannot be cancelled after record 12, and the 23rd record is the reviewer', () => {
    Object.assign(store.s.flags, { assembledKell: true, sawSelf: true, youInRegister: true });
    typeAll(11);
    expect(E.eraseLocked(store.s)).toBe(false);
    typeAll(12);
    expect(E.eraseLocked(store.s)).toBe(true);
    expect(E.serviceLine(12, store.s)).toContain('Point of no return');
    const last = E.records(store.s)[22];
    expect(last.forename).toBe('Reona');
    expect(last.surname).toBe('Dunmore');
    expect(last.pupil).toBe(true);
    expect(E.serviceLine(21, store.s)).toContain('1 pupil present');
  });

  it('the 23rd removal ends the story in red, and progress survives a reload', () => {
    Object.assign(store.s.flags, { assembledKell: true, sawSelf: true });
    typeAll(22);
    expect(store.load(0)?.flags.eraseCount).toBe(22);
    expect(store.s.ending).toBeNull();
    expect(E.removeNext('Reona Dunmore')).toEqual({ ok: true, done: true });
    expect(store.s.ending).toBe('erase');
    expect(store.s.phase).toBe('ending');
    expect(E.eraseLocked(store.s)).toBe(false);
  });

  it('leaves its own note on the Desktop', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'nf-erase-'));
    expect(await leaveNote(dir, { ending: 'erase', name: 'Reona' })).toBe('rec_0435.txt');
    const text = readFileSync(path.join(dir, 'rec_0435.txt'), 'utf8');
    expect(text).toContain('REMOVED');
    expect(text).toContain('Record 23 : Dunmore, Reona.');
  });
});
