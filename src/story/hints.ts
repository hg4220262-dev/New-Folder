import { onStory, hrsLog, journalLine, balloon } from '../engine/director';
import type { State } from '../engine/state';
import { WEIR_PAPERS, audit } from './storage';

// If the player stalls on the storage trail, the Continuity Service (which half wants to be found)
// lets slip a clue. Level 1 goes quietly into the event log and its journal; level 2 is a
// leaked balloon. Nothing fires until several minutes have passed with no progress.
const WAIT = 4 * 60_000;

const HINTS: [string, string][] = [
  ['C:\\HRS\\Carrow: 6 folders listed in Explorer, 7 on disk. 1 folder with attribute H, created 11/08/2008 10:14.', 'Hidden folder: C:\\HRS\\Carrow\\~unmatched. 1 text file, README_replication.txt, created 11/08/2008 10:14.'],
  ['C:\\Program Files\\HRS Archive Tools: 3 files installed 11/08/2008 09:38. 1 opened by this account.', 'Storage cluster client: settings in hsc.ini, C:\\Program Files\\HRS Archive Tools. Modified 11/08/2008 09:38.'],
  ['Web filter: ON (reviewer account). Settings file under system32, attributes H, S. Not opened by this account.', 'Web filter: ON. Support phrase on file in assistant.ini (C:\\WINDOWS\\system32\\hrsassist). Lockout after 3 failed unlocks.'],
  ["Inbox: HRS IT, 08/08/2008 09:20, 'Welcome to Halden Records - your accounts'. 3 accounts listed.", 'Password (hsc.ini): not stored; see IT welcome e-mail. Inbox: 1 message from HRS IT, 08/08/2008, 3 accounts listed.'],
  ['HSC client: board_report_12081979.doc, 5 blocks, replication 3. Each fetched copy carries CRC: OK or CRC: FAIL in its header.', 'Fetched blocks: saved to My Documents\\HSC Downloads. hscjoin.exe (HRS Archive Tools) joins 5 blocks in block order.'],
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
  f.lastNote = text;
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
    'HSC /browse: 5 files. Joined: board_report_12081979.doc. Not joined: it_handover_2008.txt (3 blocks), kell_inquiry_draft.doc (3 blocks).',
    'HSC /browse: 3 Degraded files, 1 joined. it_handover_2008.txt: 3 blocks, prefix ops_, replication 3.',
    'it_handover_2008.txt: blocks ops_0001-ops_0003. Each has 1 or more replicas with CRC: OK outside Rack 2. hscjoin.exe joins them in order.'] },
  { at: (s) => !s.flags.adminEver, lines: [
    'Accounts on this computer: 2. Administrator: password last set 30/06/2008 (K. Aldous, IT handover).',
    "Welcome screen: 2 accounts, the reviewer's and Administrator. Administrator: password-protected.",
    "IT Handover Note (joined), Reviewer laptops: 'Local Administrator: password reset 30/06/2008 ... TODO: change at handover.' Not changed."] },
  { at: (s) => !s.flags.rack2On, lines: [
    'Rack 2 (Plant Room): top-of-rack switch not responding since 03/2008. 2 DataNodes, dn-21.hsc and dn-22.hsc, no heartbeat.',
    'Rack 2 (Plant Room): switch not responding since 03/2008. Reset available from the Service Console on the Administrator desktop.',
    "Service Console, Storage cluster link: Rack 2 'Switch not responding'. Control 'Power-cycle Rack 2 switch' enabled for Administrator."] },
  { at: (s) => !s.flags.assembledKell, lines: [
    'Live DataNodes: 6 of 6. kell_inquiry_draft.doc, 3 blocks: block 2 has no replica with CRC: OK outside Rack 2 (Plant Room).',
    'Rack 2 (Plant Room): Live. kell_inquiry_draft.doc, 3 blocks: block 2 passes CRC on dn-21.hsc and dn-22.hsc only.',
    'HSC Downloads: kbk_0001-kbk_0003 join with hscjoin.exe in block order. A copy with CRC: FAIL in its header will not join.'] },
  { at: (s) => !s.flags.weirSeenDown, lines: [
    "Volume mounted: nantweir.stn, read-only. State: no carrier. Listed in the cluster page header as 'Mounted: nantweir.stn'.",
    'Volumes on the cluster page: 2. nantweir.stn was mounted when the 3 Degraded files were joined. State: no carrier.',
    'nantweir.stn: Nant Weir telemetry station (contractor, 1986). Mounted read-only from the cluster. Link: Carrow Cable trunk, node CN-7.'] },
  { at: (s) => !s.flags.coaxAuth, lines: [
    'nantweir.stn link: Carrow Cable trunk, node CN-7, not the data network. Dialler: linkterm.exe, C:\\HRS\\Admin (Administrator only).',
    "Folder C:\\HRS\\Admin (Administrator only): linkterm.exe; 'Weir telemetry - service account.txt', 2 accounts listed.",
    "linkterm.exe: CONNECT <host>. CN-7 is 'Engineering access only'. 1 engineering account is in 'Weir telemetry - service account.txt'."] },
  { at: (s) => !s.flags.coaxUp, lines: [
    'CN-7 session open. Return path: blocked. Channel plan: 14 entries, 13 assigned, 1 (unassigned).',
    'CN-7: return path blocked. Telemetry note (C:\\HRS\\Admin), TODO: carrier channel number, not in the 1986 paperwork.',
    'linkterm.exe: TUNE <channel> sets the return path. Telemetry note, TODO, contractor: carrier is the PLAN entry with no programme assigned.'] },
  { at: (s) => !s.flags.weirAuth, lines: [
    'nantweir.stn: carrier present, no session. Service accounts only. Reached by CONNECT weir from linkterm.exe.',
    'Nant Weir terminal: service accounts only. 1 weir service account recorded in C:\\HRS\\Admin.',
    "'Weir telemetry - service account.txt', Accounts: CN-7 node (engineering login); Weir terminal (contractor service account)."] },
  { at: (s) => (s.flags.weirRead ?? []).length < WEIR_PAPERS, lines: [
    'nantweir.stn: /keeper 3 files, /archive 3, /telemetry 1, /station 1 and sluice_panel (live). Fewer than 4 files opened.',
    'nantweir.stn: 8 papers in 4 directories. Fewer than 4 opened. sluice_panel listed under /station.',
    "/station/sluice_manual.txt, 4.2: station code in 2 parts; part 2 is given for this installation. 4.3: an officer's name is also required."] },
  { at: (s) => !s.flags.codeOk, lines: [
    'sluice_panel: station code rejected. Part 1 is the station word (keeper\'s book: "same as the door").',
    'C:\\HRS\\Carrow\\04 Photographs: 1 photograph of the station, 1979. Its caption describes the door.',
    "Weir keeper's cottage.jpg, Properties, Summary: the caption names the bird on the station door."] },
  { at: () => true, lines: [
    'nantweir.stn: sluice panel authority list has 1 entry, dated 06/1979.',
    'sluice_panel (nantweir.stn): accepts only an officer on its authority list. Authority list: 1 entry, dated 06/1979.',
    'Authority list, 06/1979, 1 entry: Engineer to the Board. Board papers 1978-80 name 1 holder of that post.'] },
];
// A minute after the report is joined, the store tries to do to the reviewer's copy what it did to Price's.
onStory((s, e) => {
  if (e.t !== 'tick' || !s.flags.assembled || s.flags.auditDel || s.playMs - (s.flags.assembledAt ?? s.playMs) < 60_000) return;
  s.flags.auditDel = true;
  audit('DELETE joined copy (reviewer) FAILED (client offline)', 'SYSTEM');
  hrsLog('hsc.haldenrecords.co.uk: DELETE joined copy (reviewer) FAILED (client offline).', 'Warning');
});

const TRAIL_WAIT = 2.5 * 60_000;
onStory((s, e) => {
  if (e.t !== 'tick' || !s.flags.assembled || s.flags.sluicesOpen || s.ending) return;
  const st = TRAIL.findIndex((x) => x.at(s));
  stall(s, 'trail', st, TRAIL[st].lines, TRAIL_WAIT);
});
