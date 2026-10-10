import { store } from '../engine/state';
import { stamp } from '../engine/clock';
import { balloon, hrsLog, journalLine } from '../engine/director';
import { sfx } from '../engine/bus';
import type { NodeId } from '../engine/types';

// The Halden Storage Cluster: an off-laptop store modelled loosely on a Hadoop-style file system.
// A file is cut into blocks; each block has three replicas spread over racks (copy 2 on another rack,
// copy 3 on the same rack as copy 2). Rack 2 has lost its switch until an administrator power-cycles it.
export const HSC_HOST = 'hsc.haldenrecords.co.uk:50070';
export const HSC_USER = 'reviewer';
export const HSC_PASSWORD = 'bluefinch42'; // in the IT welcome e-mail
export const RACKS: Record<string, string> = { r1: 'Rack 1 (Basement)', r2: 'Rack 2 (Plant Room)', r3: 'Rack 3 (Annexe)' };
export const OFFLINE = 'r2';
export const NODES = ['r1n1', 'r1n2', 'r2n1', 'r2n2', 'r3n1', 'r3n2'];
export const rackOf = (node: string) => node.slice(0, 2);
/** A node is unreachable while its rack is down (until an administrator power-cycles the switch). */
export const rackDown = (node: string) => rackOf(node) === OFFLINE && !store.s.flags.rack2On;
export const nodeLabel = (node: string) => `dn-${node.slice(1, 2)}${node.slice(3)}.hsc`;

export interface Replica { node: string; ok: boolean }
export interface FileSpec {
  key: string; name: string; prefix: string; flag: string; docId: string; docName: string; text: string[]; place: Replica[][];
  logLine: string; journal: string; balloon: string;
}

export const FILES: FileSpec[] = [
  {
    key: 'report', name: 'board_report_12081979.doc', prefix: 'blk', flag: 'assembled', docId: 'mrreport', docName: 'Board Report 12-08-1979 (joined).doc',
    text: [
      "# WENDELL WATER BOARD\n\n## Report to the Chairman on the closure of the gates at Nant Weir, 12 and 13 August 1979. Confidential.\n\nPrepared by the Clerk from the office diary, the telephone messages taken and the keeper's gate log, read over to this office on 14 August. Not for the minutes.",
      "**1. Contractor.** A telegram was received from Kestrel Civil Engineering Ltd on 10 August stating that the clause 14 bonus (£180,000) is payable if impounding begins on or before 12 August, and asking the Board to confirm that the gates would close by that date. The Chairman confirmed by telephone the same day.\n\n**2. Clause 15.** No certificate that the valley was clear had been given by the Engineer, Mr R. Kell. His note MR-1 of 11 August declined to certify while Mill Row remained occupied. The Engineer was not consulted on the 12th.\n\n**3. Instruction to the keeper.** At 08:40 on Sunday 12 August the Chairman telephoned the keeper, Mr E. Rowley, at the Nant Weir call box and instructed him to close the gates at 09:00. The keeper recorded the instruction in the gate log.",
      "**4. Mill Row.** At 08:55 the Housing Officer, Mr J. Amory, telephoned the Chairman to report that the six households of Mill Row (23 persons) had not been moved and were booked for removal at 08:00 on 13 August. The Chairman directed that the Certificate be completed at 412 recorded and 412 rehoused, being the number on the Relocation List, and that the instruction to the keeper stood.\n\n**5. Certificate.** The Evacuation Completion Certificate was signed by the Chairman at 09:00 for the Board's engineer. The gates were closed at 09:00. Level 118.6 m.",
      "**6. Levels.** Heavy rain on the hills from 08:00; 18.5 mm was recorded for the day. Level 124.9 m at 10:00. Level 134.6 m at 12:00, when the old bridge road was shut. Level 141.5 m at 15:00. Mill Row stands at 141.2 m.\n\n**7. The Engineer.** At 16:00 Mr Kell attended at the weir and asked the keeper to open the gates. The keeper had no instruction to do so and the gates remained closed. A call from the Nant Weir call box to the Board office at 16:20 was not answered. Level 144.0 m at 18:00; Chapel Row under water.",
      "**8. 13 August.** The lorry and two men booked with Evans & Sons for Mill Row on 13 August were cancelled by telephone on the 12th. At 08:30 on the 13th the Engineer was informed by telephone from this office that Mill Row was confirmed empty. Level 146.3 m at 09:00.\n\n**9. Chairman's directions.** (a) The figure of 412 stands as the Board's figure and the Relocation List is closed at 412 names. (b) Kestrel Civil Engineering Ltd to be informed that impounding began at 09:00 on 12 August and that the clause 14 bonus is payable. (c) This report is for the Chairman only. It is not to be filed with the Board's papers and is not to be copied.\n\n> M. Hughes, Clerk to the Board. 14 August 1979.",
    ],
    // Hand-placed so every block has at least one good replica outside the dead rack.
    place: [
      [{ node: 'r1n1', ok: true }, { node: 'r2n1', ok: true }, { node: 'r2n2', ok: true }],
      [{ node: 'r3n2', ok: false }, { node: 'r1n2', ok: true }, { node: 'r1n1', ok: false }],
      [{ node: 'r2n2', ok: true }, { node: 'r3n1', ok: false }, { node: 'r3n2', ok: true }],
      [{ node: 'r1n2', ok: false }, { node: 'r3n2', ok: false }, { node: 'r3n1', ok: true }],
      [{ node: 'r2n1', ok: true }, { node: 'r3n1', ok: false }, { node: 'r3n2', ok: true }],
    ],
    logLine: 'File joined by reviewer: board_report_12081979.doc (5 blocks) in My Documents\\HSC Downloads. Not matched to Authority (412).',
    journal: 'Joined (reviewer): board_report_12081979.doc, 5 blocks.\nConflict. Report: Mill Row, 23 not moved. Authority=412.\nHide ......... REJECTED\n(file is on the store, not in the archive)',
    balloon: 'Join complete. Board Report 12-08-1979 (joined).doc saved to My Documents\\HSC Downloads.',
  },
  {
    key: 'kell', name: 'kell_inquiry_draft.doc', prefix: 'kbk', flag: 'assembledKell', docId: 'kellstmt', docName: 'Kell Inquiry Statement (draft).doc',
    text: [
      "# STATEMENT OF R. KELL, ENGINEER\n\n## Draft. 2 March 1980. Prepared for the inquiry.\n\n1. I am Engineer to the Wendell Water Board for the Carrow Reservoir Scheme. Under clause 15 of the Board's agreement with Kestrel Civil Engineering Ltd no impounding was to begin until I had certified in writing that the valley was clear of residents. I gave no certificate. My note MR-1 of 11 August 1979 declined one while Mill Row was occupied.\n\n2. I was not told that the gates were to be closed on Sunday 12 August 1979. I went down to Mill Row at about 3 pm. The water was over the road at the old bridge. There were people upstairs in at least three of the houses. I took one photograph from the bridge at 3.10 pm.\n\n3. I went on to the weir and at 4 pm asked the keeper, Mr Rowley, to open the gates. He had an instruction by telephone from the Chairman to close them and none to open them. I left a note with him and telephoned the Board office from the call box at 4.20 pm. There was no answer.",
      "4. The twenty-three persons at Mill Row on 12 August 1979 were, by house:\n\n1 Mill Row. Thomas Pryce, 44; Ann Pryce, 41; Mary, 9; Jack, 7; Lily, 4.\n\n2 Mill Row. George Ellery, 67; Edith Ellery, 65; Ruth Ellery, 38; Peter, 10.\n\n3 Mill Row. Walter Marsh, 72; Iris Marsh, 70; Owen Marsh, 45.\n\n4 Mill Row. David Hollins, 35; Carol Hollins, 33; Susan, 8; Paul, 6.\n\n5 Mill Row. Harold Webb, 58; Joan Webb, 57.\n\n6 Mill Row. Michael Dunmore, 29; Helen Dunmore, 27; Clare, 5; Ian, 3; and an infant, not named on any Board list.\n\n5. None of these names is on the Relocation List of 412. The houses allotted to them at Halden Park, numbers 97 to 102, were among the eight (97 to 104) which have not been built.",
      "6. On 13 August at 8.30 am I was telephoned by the Board office and told that Mill Row was confirmed empty. I asked who had confirmed it and have had no answer. I asked to see the record of where the six households had gone. No record has been shown to me.\n\n7. I have asked the Board in writing that the reservoir be drawn down below 141.2 m so that the six houses can be entered. The Board has replied that the houses were empty on the 12th and that the question does not arise. The gates at Nant Weir have not been moved since 9 am on 12 August 1979.\n\n8. I have lodged copies of the following with the keeper at Nant Weir station: the Halden Exchange record of calls for 12 and 13 August 1979; the contractor's telegram of 10 August 1979; the Housing Department's list of households not moved as at 11 August 1979. The originals are with the Board.\n\n> R. Kell. Draft.",
    ],
    // The middle block's only good replicas are on Rack 2, so the switch has to be restored first.
    place: [
      [{ node: 'r3n1', ok: true }, { node: 'r2n2', ok: true }, { node: 'r2n1', ok: true }],
      [{ node: 'r1n1', ok: false }, { node: 'r2n1', ok: true }, { node: 'r2n2', ok: true }],
      [{ node: 'r1n2', ok: true }, { node: 'r3n2', ok: false }, { node: 'r3n1', ok: true }],
    ],
    logLine: 'File joined by reviewer: kell_inquiry_draft.doc (3 blocks) in My Documents\\HSC Downloads. 23 names in file are Continued records.',
    journal: 'Joined (reviewer): kell_inquiry_draft.doc, 3 blocks.\n23 names read. All 23 are Continued records.\nHarmonise .... REJECTED\n(file is read-only, HSC)',
    balloon: 'Join complete. Kell Inquiry Statement (draft).doc saved to My Documents\\HSC Downloads.',
  },
  {
    key: 'ops', name: 'it_handover_2008.txt', prefix: 'ops', flag: 'assembledOps', docId: 'ithandover', docName: 'IT Handover Note (joined).doc',
    text: [
      "# IT HANDOVER\n\n## Halden Records Services Ltd. K. Aldous, systems administrator. 30/06/2008.\n\nReviewer laptops\n- Image: Windows XP SP2, HRS Archive Tools 2.1 (Archive Assistant, Continuity Service, web filter, HSC client, hscjoin.exe).\n- Reviewer accounts: local, no password set. Task Manager and Event Viewer disabled by policy. Both can be lifted from the Service Console.\n- Local Administrator: password reset 30/06/2008 to cobalt-lantern-17. TODO: change at handover. Please do not share.",
      "Storage cluster (HSC)\n- NameNode: hsc.haldenrecords.co.uk:50070. Replication 3, 64 MB blocks. Client settings in hsc.ini under Program Files\\HRS Archive Tools.\n- Rack 1 (Basement): dn-11, dn-12. Rack 2 (Plant Room): dn-21, dn-22. Rack 3 (Annexe): dn-31, dn-32.\n- Rack 2: top-of-rack switch not responding since 03/2008. No heartbeat from dn-21, dn-22. Cluster serves from racks 1 and 3; blocks whose only good replicas are on rack 2 time out. Power-cycle is from the Service Console (Administrator). TODO: power-cycle and re-check heartbeat.",
      "Other\n- Weir telemetry: nantweir.stn is exported to the NameNode as a read-only volume (contractor's export, not tested) but is reached over the old Carrow Cable trunk (contractor, 1986), not the data network. Node login and station service account are in the telemetry note in the Admin folder (C:\\HRS\\Admin, Administrator only), with linkterm.exe. Not in use since the contractor's install.\n- Service Console (Administrator desktop): service status, web filter on/off, reviewer account restrictions, storage cluster link (Rack 2 power-cycle), public record.\n- Don't leave the Service Console open on a reviewer laptop.\n\n> K.",
    ],
    place: [
      [{ node: 'r3n2', ok: true }, { node: 'r1n1', ok: false }, { node: 'r1n2', ok: true }],
      [{ node: 'r1n2', ok: false }, { node: 'r3n1', ok: true }, { node: 'r3n2', ok: true }],
      [{ node: 'r1n1', ok: true }, { node: 'r3n2', ok: true }, { node: 'r3n1', ok: false }],
    ],
    logLine: 'File joined by reviewer: it_handover_2008.txt (3 blocks) in My Documents\\HSC Downloads. No Carrow records in file.',
    journal: 'Joined (reviewer): it_handover_2008.txt, 3 blocks.\nNo Carrow records in file. No action.',
    balloon: 'Join complete. IT Handover Note (joined).doc saved to My Documents\\HSC Downloads.',
  },
];
export const specOf = (key: string): FileSpec => FILES.find((f) => f.key === key) ?? FILES[0];

const scramble = (t: string) => t.replace(/[A-Za-z0-9]/g, (c, k: number) => String.fromCharCode(((c.charCodeAt(0) * 7 + k * 13) % 26) + 97));

function replicaText(key: string, block: number, copy: number): string {
  const f = specOf(key);
  const r = f.place[block - 1][copy];
  const head = `BLOCK ${block} OF ${f.text.length}\nFILE: ${f.name}\nREPLICA: ${copy + 1} of 3 (${RACKS[rackOf(r.node)]}, ${nodeLabel(r.node)})\nCRC: ${r.ok ? 'OK' : 'FAIL'}\n----------------\n`;
  return head + (r.ok ? f.text[block - 1] : scramble(f.text[block - 1]));
}

export type Fetch = { status: 'timeout' | 'exists' | 'ok' | 'crc'; name?: string };
const dlName = (f: FileSpec, block: number, node: string) => `${f.prefix}_000${block}_${node}.blk`;

function ensureFolder(): NodeId {
  const s = store.s;
  if (!s.fs.hscdl) s.fs.hscdl = { id: 'hscdl', name: 'HSC Downloads', kind: 'folder', parents: ['mydocs'], created: stamp(), modified: stamp() };
  return 'hscdl';
}

/** Download one replica to My Documents\HSC Downloads. */
export function fetchReplica(key: string, block: number, copy: number): Fetch {
  const s = store.s;
  const f = specOf(key);
  const r = f.place[block - 1][copy];
  if (rackDown(r.node)) return { status: 'timeout' };
  const folder = ensureFolder();
  const name = dlName(f, block, r.node);
  const id = `${f.prefix}${block}${r.node}`;
  const old = s.fs[id];
  // A live copy counts wherever the player moved or renamed it; a binned one is fetched afresh.
  if ((old && !old.parents.includes('bin')) || Object.values(s.fs).some((n) => n.parents.includes(folder) && n.name === name)) return { status: 'exists', name };
  s.fs[id] = { id, name, kind: 'txt', parents: [folder], created: stamp(), modified: stamp(), content: replicaText(key, block, copy), unsearchable: true, author: 'HSC' };
  store.bump();
  return { status: r.ok ? 'ok' : 'crc', name };
}

/** hscjoin.exe: the file is worked out from the first piece; the pieces must be in block order. */
export function joinPieces(ids: string[]): { ok: true; name: string } | { ok: false; why: string } {
  const first = store.s.fs[ids[0] ?? ''];
  if (!first) return { ok: false, why: 'No blocks in the join order.' };
  const f = FILES.find((x) => first.name.startsWith(`${x.prefix}_`));
  if (!f) return { ok: false, why: `${first.name} is not an HSC block.` };
  if (ids.length !== f.text.length) return { ok: false, why: `Join failed: ${f.name} has ${f.text.length} blocks; ${ids.length} in the join order.` };
  const r = tryJoin(f.key, ids);
  return r.ok ? { ok: true, name: f.docName } : r;
}

/**
 * The player's join: one downloaded copy is chosen for each block, in order. The cluster only
 * checks the copies against their checksums; it does not say which replica to have used.
 */
export function tryJoin(key: string, picks: string[]): { ok: true } | { ok: false; why: string } {
  const s = store.s;
  const f = specOf(key);
  for (let b = 1; b <= f.text.length; b++) {
    const n = s.fs[picks[b - 1] ?? ''];
    if (!n || !n.parents.includes('hscdl')) return { ok: false, why: `Join failed: block ${b} not found in HSC Downloads.` };
    if (!new RegExp(`^${f.prefix}_000${b}_`).test(n.name)) return { ok: false, why: `Join failed: position ${b} is not block ${b} of ${f.name}.` };
    if (!/CRC: OK/.test(n.content ?? '')) return { ok: false, why: `Join failed: block ${b}: CRC FAIL.` };
  }
  if (!s.flags[f.flag]) {
    s.flags[f.flag] = true;
    s.fs[f.docId] = {
      id: f.docId, name: f.docName, kind: 'doc', parents: ['hscdl'], created: stamp(), modified: stamp(),
      readOnly: true, author: 'HSC', comments: `Reassembled from ${f.text.length} blocks.`, content: f.text.join('\n\n'),
    };
    hrsLog(f.logLine, 'Error');
    journalLine(f.journal);
    balloon('HSC Client', f.balloon, f.docId);
    sfx('ding');
    store.bump();
    if (weirMounted()) {
      hrsLog('Volume mounted on hsc.haldenrecords.co.uk:50070: nantweir.stn (read-only). Not an archive volume.', 'Warning');
      journalLine('Mounted: nantweir.stn (read-only). 4 directories, 8 files.\n0 Carrow records. Outside Authority scope. No action.');
      setTimeout(() => { balloon('HSC Client', 'Volume mounted: nantweir.stn (read-only). 4 directories, 8 files. Listed on the cluster page.'); sfx('ding'); store.bump(); }, 3500);
    }
  }
  return { ok: true };
}

// The weir station: a second machine on the cluster's network, mounted once all three cluster files are joined.
export const WEIR_HOST = 'nantweir.stn';
export const WEIR_USER = 'rowley';
export const WEIR_PASSWORD = 'hazel-ferry-88'; // in the Administrator's Admin folder
// The weir's telemetry link rides the old Carrow Cable television trunk. Its distribution node (CN-7) has to be
// tuned to the telemetry carrier before the station terminal will take a login.
export const COAX_USER = 'headend';
export const COAX_PASSWORD = 'tern-ledger-52'; // in the Administrator's Admin folder
export const COAX_CHANNEL = 38;
/** The node's channel plan. The weir's telemetry rides the one channel nobody was ever given. */
export const COAX_PLAN: [number, string][] = [
  [2, 'Halden Regional'], [3, 'Network 3'], [4, 'Network 4'], [5, 'Local Information'], [6, 'Shopping'], [8, 'Test card'], [11, 'Racing'],
  [21, 'Halden Community'], [27, 'Carrow Cable Guide'], [33, 'Weather'], [COAX_CHANNEL, '(unassigned)'], [41, 'Old Films'], [45, 'Late Night'], [52, 'Cable Radio'],
];
export const SLUICE_CODE = 'kingfisher-6403'; // two halves: the bird on the station door (keeper notes + the archive photo), '6403' (manual)
/** The weir is only reachable once all three cluster files are joined. */
export const weirMounted = () => !!(store.s.flags.assembled && store.s.flags.assembledKell && store.s.flags.assembledOps);
export const WEIR_DIRS: Record<string, { label: string; blurb: string; files: string[] }> = {
  keeper: { label: 'keeper', blurb: "Keeper's book and correspondence, 1978-1986. Typed copies.", files: ['keeper_notes', 'kell_visit', 'rowley_letter'] },
  archive: { label: 'archive', blurb: 'Board papers deposited at the station, 1979-1980.', files: ['phone_log', 'bonus_telegram', 'millrow_list'] },
  telemetry: { label: 'telemetry', blurb: 'Level log, automatic. Readings 06:00 and 12:00.', files: ['levels'] },
  station: { label: 'station', blurb: 'Control room. Panel manual.', files: ['manual'] },
};
export const WEIR_FILES: Record<string, { name: string; text: string }> = {
  keeper_notes: { name: 'keeper_notes.txt', text: "NANT WEIR. KEEPER'S BOOK.\nE. Rowley, keeper 1978-1986. Typed copy made at handover, September 1986.\n\nMar 78.  Started. Cottage damp. Board to send a stove.\nOct 78.  Gates hung. Mr Kell worked each one up and down twice. Sill 118.0.\nNov 78.  Stove came. Chimney smokes in an east wind.\nFeb 79.  Ice on the sill. Gates worked free by hand, all three.\nJun 79.  Operating instructions from the office. Gates on the Board's\n         instruction. Mr Kell to be told of any movement.\nJun 79.  Station room finished. Panel wired and tried on all three gates.\n         Authority list made up: the Engineer. Panel code: same as the door,\n         then the number in the manual.\nJun 79.  Station door done, two coats, Board green. Same bird on it as the\n         cottage sign.\nJul 79.  Board photographer. Took the cottage and the gates from the bank.\n4 Aug 79.  Kestrel men to prove the gates. All three up and down, stop-logs\n         tried. Mr Kell present. 118.4 after.\n11 Aug 79.  6 pm gates open, 118.4. Dry. Lorries in the village all week.\n12 Aug 79.  8.40 telephone at the box. Mr Wendell-Price. Gates to be shut at 9.\n         Asked if Mr Kell knew. Told to shut them at 9.\n         9.00 shut. 118.6. Rain on the hills by 10.\n         2.55 rang Mr Kell at Halden from the box. No answer.\n         3.00 141.5. Water in the lane at Mill Row.\n         4.00 Mr Kell. Asked for the gates up. No instruction, told him so.\n         He left a note on the table and rang the office from the box, no\n         answer. Kept the note.\n         6.00 144.0. Chapel Row under. Mill Row roofs from the top window\n         till dark.\n13 Aug 79.  9.00 146.3. Rain on. Nothing from the office.\nSep 79.  Boat from the Board for the gauge. Reading Mondays.\nDec 79.  150.0 before Christmas. Spilling to the weir.\nFeb 80.  Mr Kell wrote for the log. Copied out the 11th to the 13th and sent\n         it with a letter. Kept a copy of both.\nMay 80.  Lake opened. Chairman and a band on the dam.\nSep 86.  Handed over to the telemetry contractor. Keys, book, manual, panel." },
  kell_visit: { name: 'kell_visit_note.txt', text: "(Left on the cottage table. Typed copy.)\n\nNant Weir. Sunday 12 August 1979. 4.10 pm.\n\nMr Rowley,\n\nI have asked you to raise the gates and you have told me you have the Chairman's instruction by telephone to keep them shut and nothing from the office to open them. I did not give the instruction to close and no certificate has been given under clause 15. Mill Row was not clear at 3 o'clock.\n\nI am going to telephone the Board office from the box and then drive to Halden. Please keep this note and enter the time in the log.\n\nR. Kell" },
  rowley_letter: { name: 'rowley_to_kell_1980.txt', text: "Weir Cottage, Nant Weir\n14 February 1980\n\nDear Mr Kell,\n\nI have copied out the log for the 11th to the 13th as you asked and it is enclosed. I have kept your note of the 12th and will keep it. The time you came is in the log.\n\nThe level has been at 150.0 since before Christmas. I read the gauge from the boat on Mondays.\n\nIf the Board want the log itself they must write to me for it.\n\nYours,\nE. Rowley" },
  phone_log: { name: 'exchange_log_12081979.txt', text: "POST OFFICE TELEPHONES. HALDEN EXCHANGE.\nOperator-connected calls: Nant Weir kiosk (Carrow 7) and Wendell Water\nBoard lines, 12 and 13 August 1979. Extract supplied on request, 21/02/1980.\n\n12/08/1979  08:40  Halden 2201 (Wendell-Price H., private)\n                   to Carrow 7 (Nant Weir kiosk).  Connected, 1 min.\n12/08/1979  14:55  Carrow 7 (Nant Weir kiosk)\n                   to Halden 2290 (Kell R.).  No reply.\n12/08/1979  16:20  Carrow 7 (Nant Weir kiosk)\n                   to Halden 2200 (Wendell Water Board, office).  No reply.\n13/08/1979  08:30  Halden 2200 (Wendell Water Board, office)\n                   to Halden 2290 (Kell R.).  Connected, 2 min.\n\nNo other operator-connected calls recorded on these lines." },
  bonus_telegram: { name: 'kestrel_telegram.txt', text: "POST OFFICE TELEGRAM\nOffice of origin: HALDEN. Handed in 10 AUG 79 1105. Received 1120.\nTo: WENDELL WATER BOARD HALDEN\n\nKESTREL CIVIL TO WENDELL WATER BOARD STOP CLAUSE FOURTEEN BONUS\nPAYABLE IF IMPOUNDING BEGINS TWELFTH AUGUST STOP CONFIRM GATES\nCLOSE STOP GARROW\n\nPencilled on the form: Confd by tel 10/8  H.W-P." },
  millrow_list: { name: 'millrow_households.txt', text: "WENDELL WATER BOARD. HOUSING DEPARTMENT.\nRemoval of residents. Households not yet moved as at 11 August 1979.\n\nStreet: Mill Row (ground level 141.2 m).\nRemoval day: 13 August 1979, 8 am. One lorry and two men, Evans & Sons.\nHouses allotted at Halden Park: 97 to 102 (not yet ready).\n\n1 Mill Row    Pryce      5   (2 adults, 3 children)\n2 Mill Row    Ellery     4   (3 adults, 1 child)\n3 Mill Row    Marsh      3   (3 adults)\n4 Mill Row    Hollins    4   (2 adults, 2 children)\n5 Mill Row    Webb       2   (2 adults)\n6 Mill Row    Dunmore    5   (2 adults, 2 children, 1 infant)\n                        --\n                        23\n\nAll other streets moved by 11 August. Total moved: 412.\n\nJ. Amory, Housing Officer." },
  levels: { name: 'level_readings_2008.log', text: "NANT WEIR TELEMETRY. LEVEL LOG.\nStation nantweir.stn. Gauge: upstream face. Levels in m above datum.\nDatum marks (Board survey, 1979): gate sill 118.0, Mill Row lane 141.2, top water 150.0.\nRange sill to top water: 32.0 m.\n\n11/08/2008 06:00  150.0  GATES CLOSED  spilling\n11/08/2008 12:00  150.0  GATES CLOSED  spilling\n12/08/2008 06:00  150.0  GATES CLOSED  spilling\n12/08/2008 12:00  150.0  GATES CLOSED  spilling\n13/08/2008 06:00  150.0  GATES CLOSED  spilling\n13/08/2008 12:00  150.0  GATES CLOSED  spilling\n14/08/2008 06:00  150.0  GATES CLOSED  spilling\n\nDepth over 141.2 datum mark: 8.8 m.\nGate movements since install (09/1986): none." },
  manual: { name: 'sluice_manual.txt', text: "WENDELL WATER BOARD. NANT WEIR.\nSLUICE CONTROL PANEL. OPERATING MANUAL (extract). June 1979.\n\n4. RELEASE OF THE SLUICES\n\n4.1  The sluices are released from the control panel in the station room.\n\n4.2  The panel will not move a gate until the station code has been\n     entered. The code is in two parts.\n     Part 1: the station word, assigned at commissioning.\n     Part 2: the panel number. For this installation: 6403.\n\n4.3  The panel also requires the name of an officer holding the\n     Engineer's authority. The authority list is entered at\n     commissioning and is altered only by the Engineer.\n\n4.4  Five rejected entries lock the panel for two minutes.\n\n4.5  Full release lowers the reservoir from top water level (150.0 m)\n     to the gate sill (118.0 m), a fall of 32.0 m. Allow several\n     weeks, depending on inflow.\n\n4.6  A release cannot be recalled from the panel once begun." },
};
/** Papers the reviewer has to read before the station makes sense. */
export const WEIR_PAPERS = 4;
export const WEIR_OFFICER = 'kell';
