import { describe, it, expect, beforeEach } from 'vitest';
import { mem } from './env';
import { createRequire } from 'node:module';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const { store, ALL_ENDINGS, seenEndings } = await import('../src/engine/state');
const { newState } = await import('../src/engine/director');
const { chooseEnding } = await import('../src/story/climax');
const { leaveNote } = createRequire(import.meta.url)('../electron/note.cjs');

const play = (slot: 0 | 1 | 2, chapter: number) => {
  store.slot = slot;
  store.s = newState(`P${slot}`, `Player ${slot}`);
  store.s.phase = 'desktop';
  store.s.chapter = chapter;
  store.save();
};

beforeEach(() => { mem.clear(); store.slot = 0; });

describe('save slots', () => {
  it('keeps three independent files', () => {
    play(0, 1); play(1, 3); play(2, 5);
    expect(store.slotInfo(0)?.chapter).toBe(1);
    expect(store.slotInfo(1)?.chapter).toBe(3);
    expect(store.slotInfo(2)?.user).toBe('P2');
    store.clearSave(1);
    expect(store.hasSave(1)).toBe(false);
    expect(store.hasSave(0) && store.hasSave(2)).toBe(true);
  });

  it('copies a file into an empty slot', () => {
    play(0, 4);
    store.copySave(0, 2);
    expect(store.slotInfo(2)?.chapter).toBe(4);
  });

  it('moves the old single save into File 1', () => {
    const st = newState('Old', 'Old Save');
    st.chapter = 2;
    mem.set('newfolder.save.v1', JSON.stringify(st));
    store.migrate();
    expect(store.slotInfo(0)?.chapter).toBe(2);
    expect(mem.has('newfolder.save.v1')).toBe(false);
  });

  it('never saves the title screen', () => {
    store.s = newState('T', 'T');
    store.s.phase = 'title';
    store.save();
    expect(store.hasSave(0)).toBe(false);
  });
});

describe('endings list', () => {
  it('remembers every ending reached, in list order, even after the file is erased', () => {
    play(1, 5); chooseEnding('drain');
    play(0, 5); chooseEnding('restore');
    expect(seenEndings()).toEqual(['restore', 'drain']);
    store.clearSave(1);
    expect(seenEndings()).toEqual(['restore', 'drain']);
  });
});

describe('desktop note', () => {
  it('writes a new file per ending, never overwrites, and stops at three', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'nf-note-'));
    writeFileSync(path.join(dir, 'keep.txt'), 'mine');
    expect(await leaveNote(dir, { ending: 'restore', name: 'Reona' })).toBe('rec_0435.txt');
    expect(await leaveNote(dir, { ending: 'leave', name: 'Reona' })).toBe('rec_0435 (2).txt');
    expect(await leaveNote(dir, { ending: 'signoff', name: 'Reona' })).toBe('rec_0435 (3).txt');
    expect(await leaveNote(dir, { ending: 'signoff', name: 'Reona' })).toBeNull();
    expect(readFileSync(path.join(dir, 'keep.txt'), 'utf8')).toBe('mine');
    expect(readFileSync(path.join(dir, 'rec_0435.txt'), 'utf8')).toContain('Forename  : REONA');
    expect(readdirSync(dir)).toHaveLength(4);
  });

  it('has a body for every ending the game knows', async () => {
    for (const [id] of ALL_ENDINGS) {
      const dir = mkdtempSync(path.join(tmpdir(), 'nf-note-'));
      expect(await leaveNote(dir, { ending: id, name: 'Reona' })).toBe('rec_0435.txt');
      const text = readFileSync(path.join(dir, 'rec_0435.txt'), 'utf8');
      expect(text).toContain('Status    :');
      if (id === 'recorded') expect(text).toContain('Forename: Reona.'); // the body uses the name as typed, the header uppercases it
    }
  });

  it('ignores unknown endings and unwritable folders', async () => {
    expect(await leaveNote(tmpdir(), { ending: 'nope', name: 'x' })).toBeNull();
    expect(await leaveNote('/definitely/not/here', { ending: 'leave', name: 'x' })).toBeNull();
  });

  it('strips anything but a plain name', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'nf-note-'));
    await leaveNote(dir, { ending: 'leave', name: '../../evil\n<script>' });
    const text = readFileSync(path.join(dir, 'rec_0435.txt'), 'utf8');
    expect(text).toContain('Forename  : EVILSCRIPT');
    expect(readdirSync(dir)).toEqual(['rec_0435.txt']);
  });
});
