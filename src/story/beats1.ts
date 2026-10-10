import { defineFx, balloon, hrsLog, journalLine, rewrite, after, whenUnseen } from '../engine/director';
import { sfx } from '../engine/bus';
import { SUMMARY_HARMONISED } from './world_carrow1';

/** Words the Search Companion quietly refuses to find in chapter 2. */
export const MILL = ['mill row', 'pryce', 'ellery', 'hollins', 'marsh', 'webb', 'dunmore', 'kell', 'mr-1', '435'];

defineFx({
  // ---------- Chapter 1: Trust ----------
  ch1: (s) => {
    s.suggest = ['cert', 'lnk_review'];
    after('welcome', 2500);
  },
  welcome: (s) => {
    balloon('HRS Archive Assistant', `Welcome back, ${s.user}. Your review of Carrow is nearly complete. Counts agree: 412 / 412.`, 'carrow');
  },
  tidyPhoto: (s) => {
    if (s.fs.scan412_vis) s.fs.scan412_vis.parents = [];
    const sc = s.fs.scan412;
    sc.parents = ['unm'];
    sc.versions = [{ date: '14/08/2008 09:20', author: 'SYSTEM', note: 'Renamed from "Mill Row 12-08-1979.jpg". Unmatched: disagrees with Authority.' }];
    hrsLog('1 record in 04 Photographs was tidied (unmatched).');
    journalLine('Hidden: Mill Row 12-08-1979.jpg -> scan_0412.jpg\n(reviewer looked at it for too long)');
    balloon('HRS Archive Assistant', 'Archive Assistant tidied 1 item in 04 Photographs.');
  },

  // ---------- Chapter 2: Suspicion ----------
  ch2: (s) => {
    s.suppress = MILL;
    hrsLog('Reviewer compared Census with Relocation List.', 'Warning');
    journalLine('Reviewer compared Census (435) with List (412).');
    whenUnseen('harmonise', ['summary'], 2500);
    whenUnseen('hideMR1', ['mr1', 'f_corr'], 2000);
    after('suggestCert', 40_000);
  },
  harmonise: () => {
    rewrite('summary', { content: SUMMARY_HARMONISED }, 'Harmonised with Authority (435 -> 412).');
    hrsLog('Harmonised Relocation Summary.doc with Authority (435 -> 412).');
    journalLine('Harmonised: Relocation Summary.doc 435 -> 412');
  },
  hideMR1: (s) => {
    const m = s.fs.mr1;
    m.parents = ['unm'];
    m.hidden = true;
    m.versions = [...(m.versions ?? []), { date: '14/08/2008', author: 'SYSTEM', note: 'Moved from 06 Correspondence to ~unmatched. Disagrees with Authority.' }];
    hrsLog('Hidden: MR-1 Engineer\'s Note.doc (unmatched).');
    journalLine('Hidden: MR-1 Engineer\'s Note.doc');
  },
  suggestCert: () => {
    balloon('HRS Archive Assistant', 'Suggested: Evacuation Completion Certificate.doc is the official record for this archive.', 'cert');
  },

  // ---------- Chapter 3: Investigation ----------
  ch3: (s) => {
    s.edge = 1;
    s.glitch = 1;
    s.flags.logOpen = true;
    if (!s.fs.mr1.parents.includes('unm')) { s.fs.mr1.parents = ['unm']; s.fs.mr1.hidden = true; s.fired.push('hideMR1'); }
    if (!s.fs.scan412.parents.length) {
      if (s.fs.scan412_vis) s.fs.scan412_vis.parents = [];
      s.fs.scan412.parents = ['unm'];
      s.fired.push('tidyPhoto');
    }
    s.suggest = ['lnk_review'];
    hrsLog('Reviewer opened ~unmatched. Directive conflict.', 'Warning');
    journalLine('Reviewer found ~unmatched.\nThe reviewer was not supposed to see this.');
    after('ch3Balloon', 3000);
  },
  ch3Balloon: () => {
    balloon('HRS Archive Assistant', 'These records could not be matched. They will be removed when the review is closed.', undefined, true);
  },
  conflict: (s) => {
    const where = s.fs.gatelog.parents[0];
    s.fs.conflict = {
      id: 'conflict', name: 'CONFLICT 12-08-1979 1510.txt', kind: 'txt', parents: [where], author: 'SYSTEM',
      created: '12/08/1979 15:10', modified: '12/08/1979 15:10', readOnly: true, content: CONFLICT,
    };
    hrsLog('Conflict: two records in the same folder disagree with the Authority.', 'Error');
    journalLine('Reviewer put the photograph and the gate log together.\nThey disagree with the Authority. Wrote conflict report.');
    sfx('ding');
  },
});

const CONFLICT = `HRS CONTINUITY SERVICE - CONFLICT REPORT
The records in this folder disagree with the Authority.

  Mill Row 12-08-1979.jpg    taken 12/08/1979 15:10
  Nant Weir Gate Log         12/08/1979 15:00  level 141.5 m
  Ground Levels.txt          Mill Row          141.2 m

At 15:10 the water at Mill Row was 0.3 m deep and rising.
The photograph shows people at the upstairs windows.
The Authority says the valley was clear at 09:00.

Resolution: hide one record.
Status:     PENDING (reviewer is looking)
`;
