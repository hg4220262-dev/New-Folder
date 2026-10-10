import { onStory, hrsLog, journalLine, balloon } from '../engine/director';
import type { State } from '../engine/state';
import { WEIR_PAPERS } from './storage';

// If the player stalls on the storage trail, the Continuity Service (which half wants to be found)
// lets slip a clue. Level 1 goes quietly into the event log and its journal; level 2 is a
// leaked balloon. Nothing fires until several minutes have passed with no progress.
const WAIT = 4 * 60_000;

const HINTS: [string, string][] = [
  ['Not every record is kept on this machine.', 'I left a note with the unmatched. It says where the rest went.'],
  ["The cluster's settings sit beside my own program files.", 'The tools folder in Program Files has more in it than a readme.'],
  ['The web is closed to reviewers. I am the one who closes it.', "My own files are in system32, hidden the way system files are. The filter's settings say where the phrase is kept."],
  ['Your first morning had more in it than a welcome.', 'IT sent you your accounts before you started. All of them.'],
  ['The pieces do not join themselves. A damaged copy reads like nonsense.', 'Each block says whether it survived. The tools folder has something that puts the good ones back in order.'],
];

function stage(s: State): number {
  if (s.flags.hscAuth) return 4;
  if (s.flags.webUnblocked) return 3;
  if (s.opened.includes('hsc_ini')) return 2;
  if (s.opened.includes('blkhint')) return 1;
  return 0;
}

// One escalating clue per stage: a quiet log line, then leaked balloons. Flags are `${k}Stage`, `${k}Lvl`, `${k}T`.
function stall(s: State, k: string, st: number, lines: string[], wait: number) {
  const f = s.flags;
  if (f[`${k}Stage`] !== st) { f[`${k}Stage`] = st; f[`${k}Lvl`] = 0; f[`${k}T`] = s.playMs; return; }
  const lvl: number = f[`${k}Lvl`] ?? 0;
  if (lvl >= lines.length || s.playMs - (f[`${k}T`] ?? s.playMs) < wait) return;
  const text = lines[lvl];
  f[`${k}Lvl`] = lvl + 1; f[`${k}T`] = s.playMs;
  hrsLog(text, 'Warning'); journalLine(text);
  if (lvl >= 1) balloon('HRS Archive Assistant', text, undefined, true);
}

onStory((s, e) => {
  if (e.t !== 'tick') return;
  if (s.chapter < 3 || s.flags.assembled) { s.flags.hintT = s.playMs; return; }
  const st = stage(s);
  stall(s, 'hint', st, HINTS[st], WAIT);
});

// The rest of the side route, from the first joined file to the sluices. Each stage gets plainer
// the longer the player sits on it: a quiet log line, then a balloon, then a nudge. The last tier
// still leaves the player the final step; it never names the answer.
const TRAIL: { at: (s: State) => boolean; lines: string[] }[] = [
  { at: (s) => !s.flags.assembledOps, lines: [
    'The report ends by pointing at whoever looked after this store.',
    'There is an IT handover on the cluster too. It is in pieces like the report.',
    'The handover is a file like any other on the cluster. Pieces first, then the joiner.'] },
  { at: (s) => !s.flags.adminEver, lines: [
    'The handover was written for the next administrator. Nobody has been one.',
    'The Welcome screen has a second account. Log off to reach it.',
    'Whoever wrote the handover left the next person a way in. Read it to the end.'] },
  { at: (s) => !s.flags.rack2On, lines: [
    'Something in the plant room has been dark since March.',
    "The Service Console is on the Administrator's desktop.",
    'A switch that has stopped answering can be made to start again. The console knows which one.'] },
  { at: (s) => !s.flags.assembledKell, lines: [
    'Rack 2 is back. Some pieces only ever lived there.',
    "Kell's draft is on the cluster. Part of it was never anywhere but the plant room.",
    'Now that the plant room answers, the middle of the draft can be fetched. Then join it.'] },
  { at: (s) => !s.flags.weirSeenDown, lines: [
    'The cluster has a neighbour now. Look at the top of its page.',
    'Mounted: nantweir.stn. Open it.',
    'The dam is on the same network as the records. The cluster page says so, at the top.'] },
  { at: (s) => !s.flags.coaxAuth, lines: [
    'The terminal says no carrier. Its link does not run on the data network.',
    'The trunk is the old television cable. The Administrator keeps the account for it.',
    'The Admin folder has a note about weir telemetry and a program for dialling. One reads, the other dials.'] },
  { at: (s) => !s.flags.coaxUp, lines: [
    'The node has been retuned. The weir was never on a channel anyone watched.',
    'The node will list its plan. One channel on it was never given to anything.',
    'Tune the node to the channel nobody was given.'] },
  { at: (s) => !s.flags.weirAuth, lines: [
    'The weir is answering. Go back to the dialler.',
    'The dam takes a service account, not a reviewer login.',
    "The same note that named the cable account names the keeper's."] },
  { at: (s) => (s.flags.weirRead ?? []).length < WEIR_PAPERS, lines: [
    'The weir keeper wrote down what he was never allowed to do.',
    'Open every directory on the station. Keeper, archive, station.',
    'The code is in two halves, kept in two rooms. The keeper says where the first one is painted.'] },
  { at: () => true, lines: [
    'The panel wants a name. Someone asked twice for the gates to be opened.',
    'Rowley wrote to the man who asked. Read the letter in /keeper.',
    'Only one man ever had the authority the panel asks for, and he used it to refuse.'] },
];
const TRAIL_WAIT = 2.5 * 60_000;
onStory((s, e) => {
  if (e.t !== 'tick' || !s.flags.assembled || s.flags.sluicesOpen || s.ending) return;
  const st = TRAIL.findIndex((x) => x.at(s));
  stall(s, 'trail', st, TRAIL[st].lines, TRAIL_WAIT);
});
