import type { State } from '../engine/state';

/** What the reviewer actually did, for the ending screen. Second person, in story order. */
export function recap(s: State): string[] {
  const f = s.flags;
  const mins = Math.max(1, Math.round(s.playMs / 60_000));
  const time = mins < 60 ? `${mins} minutes` : `${Math.floor(mins / 60)} hour${mins >= 120 ? 's' : ''} ${mins % 60} minutes`;
  const out = [`You spent ${time} on the Carrow archive and opened ${s.opened.length} of its files.`];
  if (s.chapter >= 2) out.push('You noticed the census said 435 where the Certificate said 412.');
  if (f.restored_scan412) out.push(s.fired.includes('conflict')
    ? 'You gave the photograph from the old bridge its name back, and saw it did not agree with the gate log.'
    : 'You gave the photograph from the old bridge its name back.');
  if (f.readKell) out.push("You found Kell's statement, which the archive would not list.");
  if (f.youInRegister) out.push('You found your own name in the school register.');
  if (f.readMemo) out.push('You read why Halden Records wanted it signed by Friday.');
  if (f.assembled) out.push(f.webUnblocked && !f.adminEver
    ? 'You got past the Archive Assistant and put the Board report back together.'
    : 'You put the Board report back together from the pieces it was hidden in.');
  if (f.adminEver) out.push(f.rack2On
    ? 'You logged on as the Administrator nobody had been, and switched Rack 2 back on.'
    : 'You logged on as the Administrator nobody had been.');
  if (f.assembledKell) out.push("You joined Kell's draft and read the twenty-three names.");
  if (f.coaxUp) out.push('You found the old television cable the dam was still talking down, and retuned it.');
  if (f.weirAuth) out.push(f.sluicesOpen
    ? 'You reached the station on top of the dam and gave the instruction nobody gave in 1979.'
    : 'You reached the station on top of the dam.');
  const found = [f.readKell, f.assembled, f.assembledKell, f.youInRegister, f.weirAuth].filter(Boolean).length;
  if (found < 3) out.push('Some of it you never found.');
  return out;
}

/** The last word on each ending: what became of the file, and of the 23. */
export const CONCLUSION: Record<string, string> = {
  signoff: 'The Carrow file was closed at 412. It was never opened again.',
  restore: 'The Carrow file stayed open at 435. The 23 are still under the water, but they are counted.',
  leave: 'The Carrow file was never closed. Somewhere, it is still being kept.',
  disclose: 'The Carrow file was closed in public, at 435. There is a stone for the 23 at Halden now.',
  drain: 'The 23 were buried at Halden in November 2008. The reservoir was never refilled.',
  signed_early: 'The Carrow file was closed at 412. You never found out why it mattered.',
  recorded: 'The Carrow file was finished at 435. There was one more name in it than there had been.',
};
