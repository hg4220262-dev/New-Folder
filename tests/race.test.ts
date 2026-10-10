import { describe, it, expect, beforeEach } from 'vitest';
import { mem } from './env';

const { store } = await import('../src/engine/state');
const { newState } = await import('../src/engine/director');
const { liveContent, makeCtx } = await import('../src/story/world');
const { bootChoice, assistantWins } = await import('../src/story/climax');
const R = await import('../src/story/race');

beforeEach(() => {
  mem.clear();
  store.slot = 0;
  store.s = newState('Reona', 'Reona Monga');
  store.s.phase = 'reboot';
});

describe('reboot race rules', () => {
  it('gets shorter and harsher with each try', () => {
    const [a, b, c] = [0, 1, 2].map(R.round);
    expect(a.ms).toBeGreaterThan(b.ms);
    expect(b.ms).toBeGreaterThan(c.ms);
    expect(a.tugMs).toBeGreaterThan(b.tugMs);
    expect(b.tugMs).toBeGreaterThan(c.tugMs);
    expect(a.shuffle).toBe(false);
    expect(b.shuffle && c.shuffle).toBe(true);
    expect(c.decoy).toBe(true);
    // Out-of-range values stay on the last try.
    expect(R.round(9).no).toBe(R.TRIES - 1);
    expect(R.round(-1).no).toBe(0);
  });

  it('builds the menu like the real one, and only adds the fake Safe Mode on the last try', () => {
    expect(R.options(R.round(0))).toEqual(['safe', 'net', 'cmd', 'lkg', 'normal']);
    expect(R.rows(R.options(R.round(0)))).toEqual(['safe', 'net', 'cmd', null, 'lkg', null, 'normal']);
    const last = R.options(R.round(2));
    expect(last).toContain('decoy');
    expect(last.filter((o) => o === 'safe')).toHaveLength(1);
    expect(R.BOOT_LABEL.decoy).not.toBe(R.BOOT_LABEL.safe);
    expect(R.BOOT_LABEL.decoy.startsWith(R.BOOT_LABEL.safe)).toBe(true);
  });

  it('reshuffling always moves Safe Mode and keeps every option', () => {
    const order = R.options(R.round(2));
    for (let i = 0; i < 200; i++) {
      const next = R.reshuffle(order);
      expect([...next].sort()).toEqual([...order].sort());
      expect(next.indexOf('safe')).not.toBe(order.indexOf('safe'));
    }
    // Even with a random source that never shuffles anything.
    const stuck = R.reshuffle(order, () => 0.999999);
    expect(stuck.indexOf('safe')).not.toBe(order.indexOf('safe'));
  });

  it('the assistant explains itself when it wins a try', () => {
    const timeout = R.actLines(null, 'Reona', 1).join('\n');
    expect(timeout).toContain('No option was chosen in time.');
    expect(timeout).toContain('SafeMode=SKIP');
    expect(timeout).toContain('1 of 3');
    expect(R.actLines('lkg', 'Reona', 2).join('\n')).toContain('Restored: HRS Continuity Service');
    expect(R.actLines('decoy', 'Reona', 3).join('\n')).toContain('added by HRS Archive Assistant');
    expect(R.actLines('normal', 'Reona', 3).join('\n')).toContain('Record 23 is finished.');
  });
});

describe('reboot race outcome', () => {
  it('only plain Safe Mode wins', () => {
    for (const o of ['net', 'cmd', 'lkg', 'normal', 'decoy'] as const) {
      store.s.flags.raceLosses = 0;
      expect(bootChoice(o)).toBe('retry');
      expect(store.s.safeMode).toBe(false);
    }
    store.s.flags.raceLosses = 0;
    expect(bootChoice('safe')).toBe('win');
    expect(store.s.safeMode).toBe(true);
    expect(store.s.flags.raceWon).toBe(true);
  });

  it('three lost tries (wrong pick or time out) give the assistant the record', () => {
    expect(bootChoice(null)).toBe('retry');
    expect(bootChoice('normal')).toBe('retry');
    expect(bootChoice('decoy')).toBe('lost');
    expect(store.s.flags.raceLosses).toBe(3);
    // Progress is saved, so quitting mid-race does not reset the tries.
    expect(store.load(0)?.flags.raceLosses).toBe(3);
    assistantWins();
    expect(store.s.ending).toBe('recorded');
    expect(store.s.phase).toBe('ending');
    expect(store.slotInfo(0)?.ending).toBe('recorded');
  });

  it('a win on the last try still counts', () => {
    bootChoice(null); bootChoice(null);
    expect(bootChoice('safe')).toBe('win');
    expect(store.s.flags.raceLosses).toBe(2);
  });
});

describe('race clues', () => {
  it('the journal says it in chapter 5', async () => {
    await import('../src/story/triggers');
    const { setChapter } = await import('../src/engine/director');
    store.s.phase = 'desktop';
    setChapter(5);
    const text = liveContent(store.s.fs.journal, makeCtx('Reona', 'Reona Monga'), 5, store.s.flags);
    expect(text).toContain('in plain Safe Mode');
  });

  it('continuity.ini lists the startup modes', () => {
    const ini = liveContent(store.s.fs.hrsini, makeCtx('Reona', 'Reona Monga'), 5, store.s.flags);
    expect(ini).toContain('[Startup]');
    expect(ini).toContain('SafeMode=SKIP');
    expect(ini).toContain('LastKnownGood=RESTORE');
  });
});
