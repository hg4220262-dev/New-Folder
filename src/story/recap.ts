import type { State } from '../engine/state';

/** What the reviewer actually did, for the ending screen. Second person, in story order. */
export function recap(s: State): string[] {
  const f = s.flags;
  const mins = Math.max(1, Math.round(s.playMs / 60_000));
  const time = mins < 60 ? `${mins} minutes` : `${Math.floor(mins / 60)} hour${mins >= 120 ? 's' : ''} ${mins % 60} minutes`;
  const out = [`You spent ${time} on the Carrow archive and opened ${s.opened.length} of its files.`];
  if (s.chapter >= 2) out.push('You noticed the census said 435 where the Certificate said 412.');
  if (f.restored_scan412) out.push(s.fired.includes('conflict')
    ? 'You renamed scan_0412.jpg back to Mill Row 12-08-1979.jpg and filed it with the gate log.'
    : 'You renamed scan_0412.jpg back to Mill Row 12-08-1979.jpg.');
  if (f.readKell) out.push('You read kell_statement.txt at the command prompt; Explorer did not list it.');
  if (f.youInRegister) out.push('You found your own name in Carrow School Register 1979-80.');
  if (f.readMemo) out.push("You read the Director's memo on the Carrow sign-off in the Admin folder.");
  if (f.assembled) out.push(f.webUnblocked && !f.adminEver
    ? 'You unlocked the web filter, fetched the Board report from the cluster in five blocks and joined it.'
    : 'You fetched the Board report from the storage cluster in five blocks and joined it.');
  if (f.adminEver) out.push(f.rack2On
    ? 'You logged on as Administrator and power-cycled the Rack 2 switch from the Service Console.'
    : 'You logged on as Administrator.');
  if (f.assembledKell) out.push('You joined kell_inquiry_draft.doc and read the twenty-three names.');
  if (f.coaxUp) out.push('You dialled cable node CN-7 from linkterm.exe and tuned a channel to the weir telemetry carrier.');
  if (f.weirAuth) out.push(f.sluicesOpen
    ? 'You logged on to nantweir.stn and released the sluices from the station panel.'
    : 'You logged on to nantweir.stn from the link terminal.');
  const found = [f.readKell, f.assembled, f.assembledKell, f.youInRegister, f.weirAuth].filter(Boolean).length;
  if (found < 3) out.push('You left some of the hidden records unopened.');
  return out;
}

/** The last word on each ending: what became of the file, and of the 23. */
export const CONCLUSION: Record<string, string> = {
  signoff: 'The Carrow archive was certified at 412 and locked. Its 23 unmatched records were removed.',
  restore: 'The Carrow record was left open at 435, with 23 residents entered as not accounted for.',
  leave: 'The Carrow review was not closed. Halden Records still lists it as pending.',
  disclose: 'The Carrow figure was corrected to 435 in public. A stone for the 23 stands at Halden.',
  drain: 'The 23 were buried at Halden in November 2008. Lake Wendell was not refilled.',
  signed_early: 'The Carrow record was certified complete at 412 on 14 August 2008 and locked.',
  recorded: "The Carrow record was finished at 435 / 435. Record 23 carries the reviewer's forename.",
};
