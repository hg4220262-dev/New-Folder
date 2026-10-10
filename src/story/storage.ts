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
      "# WENDELL WATER BOARD\n\n## Confidential. Report on the closure of the gates at Nant Weir, 12 August 1979. For the Chair only.",
      "At 08:40 the Chair instructed the keeper by telephone to close the gates at 09:00. The Board's engineer was not consulted. Kestrel Civil Engineering were told the gates would close in time for the clause 14 bonus.",
      "At 08:55 the Housing Officer reported that Mill Row, six households and 23 people, had not been moved. The Chair replied that the Certificate would be signed at 412, and that the 23 were to be entered as rehoused by their own arrangement.",
      "At 15:00 the water at Mill Row was 0.3 m and rising. Mr Kell asked for the gates to be opened. The Chair declined and no instruction was given to the keeper.",
      "Resolution: the figure of 412 is to stand in every record. This report is to be stored in pieces on separate racks and never joined.\n\n*H. Wendell-Price.*\n\nAdministrator access notes for this store are kept in the IT handover file.",
    ],
    // Hand-placed so every block has at least one good replica outside the dead rack.
    place: [
      [{ node: 'r1n1', ok: true }, { node: 'r2n1', ok: true }, { node: 'r2n2', ok: true }],
      [{ node: 'r3n2', ok: false }, { node: 'r1n2', ok: true }, { node: 'r1n1', ok: false }],
      [{ node: 'r2n2', ok: true }, { node: 'r3n1', ok: false }, { node: 'r3n2', ok: true }],
      [{ node: 'r1n2', ok: false }, { node: 'r3n2', ok: false }, { node: 'r3n1', ok: true }],
      [{ node: 'r2n1', ok: true }, { node: 'r3n1', ok: false }, { node: 'r3n2', ok: true }],
    ],
    logLine: 'Reviewer reassembled a split record from the storage cluster.',
    journal: 'Reviewer joined the Board report.\nThe pieces were kept apart on purpose.',
    balloon: 'The Board report has been joined.',
  },
  {
    key: 'kell', name: 'kell_inquiry_draft.doc', prefix: 'kbk', flag: 'assembledKell', docId: 'kellstmt', docName: 'Kell Inquiry Statement (draft).doc',
    text: [
      "# STATEMENT FOR THE INQUIRY (DRAFT)\n\n## R. Kell, Engineer. 2 March 1980.\n\nI make this statement because the Board will not.",
      "The twenty-three persons at Mill Row were: Ann, Thomas, Mary, Jack and Lily Pryce; George, Edith, Ruth and Peter Ellery; Walter, Iris and Owen Marsh; David, Carol, Susan and Paul Hollins; Harold and Joan Webb; Michael, Helen, Clare and Ian Dunmore, and the Dunmores' infant, not yet named.",
      "The gates at Nant Weir can be released from the station on top of the dam, which is on the same network as these records. I was never allowed to try.\n\nI have lodged this with the Board's records. I am told it will be kept safe. I do not believe it will be read.\n\n*R. Kell.*",
    ],
    // The middle block's only good replicas are on Rack 2, so the switch has to be restored first.
    place: [
      [{ node: 'r3n1', ok: true }, { node: 'r2n2', ok: true }, { node: 'r2n1', ok: true }],
      [{ node: 'r1n1', ok: false }, { node: 'r2n1', ok: true }, { node: 'r2n2', ok: true }],
      [{ node: 'r1n2', ok: true }, { node: 'r3n2', ok: false }, { node: 'r3n1', ok: true }],
    ],
    logLine: "Reviewer reassembled the engineer's draft statement.",
    journal: "Reviewer joined the engineer's statement.\nThe names were never read aloud.",
    balloon: "Kell's statement has been joined.",
  },
  {
    key: 'ops', name: 'it_handover_2008.txt', prefix: 'ops', flag: 'assembledOps', docId: 'ithandover', docName: 'IT Handover Note (joined).doc',
    text: [
      "# IT HANDOVER NOTE\n\n## Halden Records Services. 30 June 2008. K. Aldous, outgoing systems administrator.\n\nEverything the next person needs is below.",
      "Reviewer laptops run the HRS tools as installed. The Administrator password has been reset to cobalt-lantern-17. Please change it on first login. Nobody has.",
      "Rack 2 has had a dead switch since March. The cluster works without it. I have left the power-cycle button in the Service Console for whoever finds it. The weir station's service login is filed in the Administrator's Admin folder.\n\n*K. Aldous.*",
    ],
    place: [
      [{ node: 'r3n2', ok: true }, { node: 'r1n1', ok: false }, { node: 'r1n2', ok: true }],
      [{ node: 'r1n2', ok: false }, { node: 'r3n1', ok: true }, { node: 'r3n2', ok: true }],
      [{ node: 'r1n1', ok: true }, { node: 'r3n2', ok: true }, { node: 'r3n1', ok: false }],
    ],
    logLine: 'Reviewer reassembled an IT handover note from the storage cluster.',
    journal: 'Reviewer joined the IT handover.\nThe administrator never changed the password.',
    balloon: 'The IT handover note has been joined.',
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
  if (!first) return { ok: false, why: 'Nothing to join. Add the pieces first.' };
  const f = FILES.find((x) => first.name.startsWith(`${x.prefix}_`));
  if (!f) return { ok: false, why: `${first.name} is not an HSC block.` };
  if (ids.length !== f.text.length) return { ok: false, why: `Join failed: ${f.name} has ${f.text.length} blocks; ${ids.length} piece${ids.length === 1 ? '' : 's'} given.` };
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
    if (!n || !n.parents.includes('hscdl')) return { ok: false, why: `Join failed: piece ${b} is missing.` };
    if (!new RegExp(`^${f.prefix}_000${b}_`).test(n.name)) return { ok: false, why: `Join failed: piece ${b} is not block ${b} of ${f.name}.` };
    if (!/CRC: OK/.test(n.content ?? '')) return { ok: false, why: `Join failed: CRC mismatch in piece ${b}.` };
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
      hrsLog('A new volume was mounted on the storage cluster: nantweir.stn.', 'Warning');
      journalLine('The cluster has a neighbour.\nIt is on top of the dam.');
      setTimeout(() => { balloon('HSC Client', 'A new volume has been mounted: nantweir.stn. See the cluster page.'); sfx('ding'); store.bump(); }, 3500);
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
  keeper: { label: 'keeper', blurb: "The keeper's cottage office.", files: ['keeper_notes', 'kell_visit', 'rowley_letter'] },
  archive: { label: 'archive', blurb: 'Papers filed at the station in 1979.', files: ['phone_log', 'bonus_telegram', 'millrow_list'] },
  telemetry: { label: 'telemetry', blurb: 'Automatic level readings. Still running.', files: ['levels'] },
  station: { label: 'station', blurb: 'The control room on top of the dam.', files: ['manual'] },
};
export const WEIR_FILES: Record<string, { name: string; text: string }> = {
  keeper_notes: { name: 'keeper_notes.txt', text: "NANT WEIR STATION - KEEPER'S NOTES\n\nE. Rowley, keeper 1978-1986. Handed over to the telemetry contractor 1986.\n\nThe gates are worked from the station on top of the dam. Mr Kell asked me twice to open them on the 12th. I had no instruction. I wrote that in the log and I have not forgotten it.\n\nThe panel will not move a gate without a station code and an officer's name. I never had either on the day. I have set the code down for whoever comes after.\n\nThe first half of the station code is the bird I painted on the station door, the year we opened. Everyone who worked here knew it, and the Board's photographer caught it. The second half is in the manual, in the station room." },
  kell_visit: { name: 'kell_visit_note.txt', text: "Left on the cottage table, 12 August 1979, 16:10.\n\nMr Rowley. I am the Engineer. Clause 15 says the gates may not be closed until I certify the valley clear, and I have not. I am asking you to open them.\n\nIf you will not, please keep this, and write down that I asked.\n\nR. Kell" },
  rowley_letter: { name: 'rowley_to_kell_1980.txt', text: "Dear Mr Kell,\n\nI kept your note and the log. I have never told anyone what the water did to Mill Row from the weir, because I could see the roofs from the cottage window until dusk.\n\nIf a time comes when the gates can be opened by someone with the right to, they will need your name on the panel. The manual says an officer with the Engineer's authority must be named. I would put yours.\n\nE. Rowley" },
  phone_log: { name: 'exchange_log_12081979.txt', text: "HALDEN EXCHANGE - CALL RECORD\n\n12/08/1979 08:40  Wendell Water Board (Chair's office) -> Nant Weir call box. Duration 1 min.\n12/08/1979 14:55  Nant Weir call box -> Mr R. Kell, Halden. No answer.\n12/08/1979 16:20  Nant Weir call box -> Board office. Unanswered.\n13/08/1979 08:30  Board office -> Mr R. Kell: 'Mill Row confirmed empty.'" },
  bonus_telegram: { name: 'kestrel_telegram.txt', text: "TELEGRAM 10/08/1979 to W. Water Board:\nKESTREL CIVIL. CLAUSE 14 BONUS PAYABLE IF IMPOUNDING BEGINS ON OR BEFORE 12 AUG. CONFIRM GATES WILL CLOSE BY THEN. 180000.\n\nPencilled underneath: 'Chair agrees. Close 12th. Do not tell the Engineer.'" },
  millrow_list: { name: 'millrow_households.txt', text: "MILL ROW - HOUSEHOLDS NOT YET MOVED (copy kept at the station)\n\n1 Mill Row  Pryce (5)\n2 Mill Row  Ellery (4)\n3 Mill Row  Marsh (3)\n4 Mill Row  Hollins (4)\n5 Mill Row  Webb (2)\n6 Mill Row  Dunmore (4 and an infant)\n\nTotal 23. Lowest dwellings in the valley (141.2 m)." },
  levels: { name: 'level_readings_2008.log', text: "NANT WEIR - TELEMETRY (automatic)\n\n13/08/2008 06:00  Level 150.0 m  (top water)\n13/08/2008 12:00  Level 150.0 m\n14/08/2008 06:00  Level 150.0 m\n\nMill Row (141.2 m) is 8.8 m under water.\nGate sill 118.0 m. A full release lowers the reservoir by 32.0 m." },
  manual: { name: 'sluice_manual.txt', text: "SLUICE CONTROL - OPERATING MANUAL (extract)\n\n1. The sluices are released from the Station panel.\n2. A release needs the station code, in two halves joined by a dash. The second half is: 6403. The first is in the keeper's notes.\n3. A release also needs the name of an officer with the Engineer's authority.\n4. Full release lowers the reservoir from top water level (150.0 m) to the gate sill (118.0 m).\n5. Allow several weeks. The lower village will become accessible as the level falls.\n6. A release cannot be recalled once begun." },
};
/** Papers the reviewer has to read before the station makes sense. */
export const WEIR_PAPERS = 4;
export const WEIR_OFFICER = 'kell';
