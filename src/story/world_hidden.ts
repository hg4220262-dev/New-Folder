import type { FNode } from '../engine/types';
import { n, scan, type Ctx } from './ctx';
import { STARTUP } from './race';

const hid ={ created: '11/08/2008 10:14', modified: '12/08/2008 02:40', hidden: true, author: 'HRS Scanning' };

/** Scans the Continuity Service hid because they did not match the Certificate. */
export function unmatched(): FNode[] {
  return [
    n('unm', '~unmatched', 'folder', ['carrow'], hid),
    n('mr1', 'MR-1 Engineer\'s Note.doc', 'doc', ['f_corr'], { ...scan, comments: 'Box 6 / Item 3. Handwritten, typed up by HRS.', content: MR1 }),
    // Created (given a parent) when the visible Mill Row photo is "tidied".
    n('scan412', 'scan_0412.jpg', 'img', [], {
      ...hid, art: 'noise', comments: 'Unmatched scan.',
      origName: 'Mill Row 12-08-1979.jpg',
      restore: { art: 'millrow', comments: 'Mill Row from the old bridge, 12 August 1979, 3.10 pm. Photograph by R. Kell. People can be seen at the upstairs windows.', modified: '12/08/1979 15:10' },
    }),
    n('regp2', 'register_p2.dat', 'dat', ['unm'], {
      ...hid, size: 3311, origName: 'Carrow School Register 1979-80.txt',
      comments: 'Unmatched. Original name withheld.',
      versions: [{ date: '11/08/2008 10:20', author: 'SYSTEM', note: 'Renamed from "Carrow School Register 1979-80.txt". Unmatched: dated after the Authority.' }],
      content: '\u0000\u0013ÿþ\u0001\u0000\u0000ÿ\u0004\u0000Ø\u0000\u0000\u0010\u0000€¿ \u0000\u0000‡\u0000\u0000\u0001',
      restore: { kind: 'txt', content: '@@REGISTER@@' },
    }),
    n('unm_info', 'desktop.ini', 'ini', ['unm'], {
      ...hid, system: true,
      content: '[.ShellClassInfo]\r\nInfoTip=Records that could not be matched to the Certificate.\r\n; removed at sign-off\r\n',
    }),
    n('blkhint', 'README_replication.txt', 'txt', ['unm'], { ...hid, content: 'HRS CONTINUITY SERVICE - REPLICATION NOTE\r\nArchive   : C:\\HRS\\Carrow\r\nAuthority : Evacuation Completion Certificate.doc (412)\r\n--------------------------------------------------------------\r\n11/08/2008 10:14  Archive loaded. 1,184 records.\r\n11/08/2008 10:17  Connected store checked: hsc.haldenrecords.co.uk:50070\r\n                  /records/carrow/  5 files.\r\n11/08/2008 10:17  Not in archive: board_report_12081979.doc\r\n                  (Board report, closure of the gates, 12/08/1979)\r\n                  5 blocks. Replication 3. Racks 1, 2, 3.\r\n11/08/2008 10:18  Option A: fetch and file with archive ..... REJECTED\r\n                  (conflicts with Authority)\r\n11/08/2008 10:18  Option B: delete from store ............... REJECTED\r\n                  (store is read-only to this service)\r\n11/08/2008 10:18  Option C: leave as stored, unjoined ....... SELECTED\r\n                  (cluster does not join blocks; blocks are\r\n                  joined by the client, in order)\r\n11/08/2008 10:18  Also not in archive: kell_inquiry_draft.doc (3 blocks;\r\n                  block 2 Rack 2 only, not read), it_handover_2008.txt\r\n                  (3 blocks; no Carrow records). No action.\r\n11/08/2008 10:18  census_1978.xls, gate_log_aug1979.log: in archive. Match.\r\n11/08/2008 10:18  Client present: hsc.ini, hscjoin.exe\r\n                  (C:\\Program Files\\HRS Archive Tools). IT build.\r\n                  Not removed.\r\n12/08/2008 02:40  Replica check. Rack 2 (Plant Room): no heartbeat.\r\n                  No action.\r\n' }),
    // Ghost: never listed by Explorer, only by `dir /a` in Command Prompt.
    n('kell', 'kell_statement.txt', 'txt', ['f_eng'], {
      created: '02/03/1980 00:00', modified: '02/03/1980 00:00', ghost: true, unsearchable: true, content: KELL,
    }),
  ];
}

/** The Continuity Service's own files (protected operating system files). */
export function agentFiles(c: Ctx): FNode[] {
  const sys = { created: '11/08/2008 09:38', modified: '14/08/2008 03:12', hidden: true, system: true };
  return [
    n('hrsdir', 'hrscont', 'folder', ['sys32'], sys),
    n('hrsasst', 'hrsassist', 'folder', ['sys32'], sys),
    n('hrsasstexe', 'hrsassist.exe', 'exe', ['hrsasst'], { ...sys, size: 688_128, locked: 'hrsassist.exe is already running.' }),
    n('hrsasstini', 'assistant.ini', 'ini', ['hrsasst'], { ...sys, readOnly: true, content: `; HRS Archive Assistant 2.1\r\n; Installed by HRS IT. Do not edit while a review is open.\r\n[Assistant]\r\nSuggest=Evacuation Completion Certificate.doc\r\nNotify=ON\r\nTidy=ON\r\nHide=UNMATCHED\r\nWebFilter=ON\r\nFilterConfig=webfilter.ini\r\n; Support phrase. IT use only.\r\nSupportPhrase=marigold-tea\r\nReviewer=${c.full}\r\n` }),
    n('hrsexe', 'hrscont.exe', 'exe', ['hrsdir'], { ...sys, size: 1_204_224, locked: 'hrscont.exe is already running.' }),
    n('hrsini', 'continuity.ini', 'ini', ['hrsdir'], { ...sys, readOnly: true, content: '@@INI@@' }),
    n('webcfg', 'webfilter.ini', 'ini', ['hrsasst'], { ...sys, readOnly: true, content: '; HRS web filter 2.1\r\n; Applies to Internet Explorer while a review is open.\r\n[Filter]\r\nState=ON\r\nScope=ALL\r\nCommand=HRSFILTER\r\nUnlock=/unlock <phrase>\r\nPhraseFile=assistant.ini\r\nLockoutAfter=3\r\nLockoutMinutes=2\r\n' }),
    n('journal', 'journal.log', 'log', ['hrsdir'], { ...sys, readOnly: true, content: '@@JOURNAL@@' }),
  ];
}

export function continuityIni(c: Ctx, ch: number): string {
  return `; HRS Continuity Service 2.1
[Service]
Directive=PRESERVE_RECORD_CONTINUITY
Authority=Evacuation Completion Certificate.doc
Mode=${ch >= 5 ? 'PROTECT' : 'HARMONISE'}
WakeOnUser=1

[Review]
Archive=C:\\HRS\\Carrow
Reviewer=${c.full}
SignOff=PENDING
OnSignOff=DELETE_UNMATCHED

[Startup]
${STARTUP.map(([, k, v]) => `${k}=${v}`).join('\n')}

[Records]
Census=435
Certified=412
Unmatched=23
Continued=23

[Record23]
Surname=Dunmore
Forename=${ch >= 4 ? c.user : ''}
Resolved=${ch >= 4 ? 'NEAREST_CANDIDATE' : 'NO'}
`;
}

const MR1 = `# ENGINEER'S NOTE MR-1

## To: H. Wendell-Price. From: R. Kell. 11 August 1979

Mill Row has not been cleared. Six households, 23 people. Their houses at Halden Park are not ready and they will not leave without somewhere to go.

Mill Row stands at **141.2 m**, lower than any other house in Carrow. Heavy rain is forecast for the 12th. If the gates are closed on the morning of the 12th, the water will reach Mill Row in the afternoon.

**I will not certify that the valley is clear.** The gates must stay open until I have seen Mill Row empty with my own eyes.

*R. Kell*`;

const KELL = `STATEMENT OF R. KELL, ENGINEER
(prepared for an inquiry. The inquiry was not held.)

On 12 August I went to Mill Row at about 3 pm. The water
was already over the road by the bridge. I took a photograph
from the bridge. There were people upstairs in at least
three of the houses. Mrs Pryce waved to me.

I went to the weir and asked for the gates to be opened.
The keeper had no instruction. I could not reach the Board.

On the 13th the Board said that Mill Row had left on the
morning of the 12th and the houses were empty. I have
asked to see the record of where they went. No such record
has been shown to me.

There is a list of 412 names. There were 435 people.

R. Kell, 2 March 1980
`;
