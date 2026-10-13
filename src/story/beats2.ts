import { defineFx, balloon, hrsLog, journalLine, rewrite, after, whenUnseen } from '../engine/director';
import { dialog } from '../engine/windows';
import { sfx } from '../engine/bus';
import { JOURNAL_END } from './journal';
import { lateMail } from './world_mail';
import { makeCtx } from './ctx';
import { climax } from './climax';
import type { State } from '../engine/state';

const SIDE_APPS = ['ie', 'joiner', 'linkterm', 'console'];
/** Out on the side route: a cluster, console or terminal window open, the Administrator on, or the report joined and no ending yet. */
export const sideBusy = (s: State) => !s.ending && (!!s.flags.assembled || s.flags.account === 'admin' || s.windows.some((w) => SIDE_APPS.includes(w.app)));

export const EVIDENCE = ['kell', 'mr1', 'regp2', 'scan412']; // the four pieces of evidence: faked into Recent in ch4, undeletable from ch3

defineFx({
  // ---------- Chapter 4: Paranoia ----------
  ch4: (s) => {
    s.edge = 2;
    s.glitch = 2;
    journalLine('Record 23 (Dunmore, infant) has no forename.\nContinuity is incomplete without it.', '13/08/2008 23:58');
    journalLine(`Searching for nearest candidate...\nCandidate: the person who read all 23.\nRecord 23 := Dunmore, ${s.user}.`, '14/08/2008 03:12');
    journalLine('On sign-off the archive will DELETE_UNMATCHED.\nRecord 23 is unmatched.\nStop suggesting Close Archive Review.\nReviewer must not close the review.', '14/08/2008 03:13');
    hrsLog(`Record 23 resolved to nearest candidate: Dunmore, ${s.user}.`, 'Error');
    s.suggest = [];
    s.suppress = [];
    whenUnseen('regYou', ['regp2'], 1200);
    whenUnseen('notesEdit', ['notes'], 1500);
    whenUnseen('profileRename', ['profile', 'docset'], 1500);
    whenUnseen('hideReview', ['lnk_review'], 0);
    after('lateMail', 20_000);
    after('recentFake', 8000);
  },
  regYou: (s) => {
    s.flags.youInRegister = true;
    rewrite('regp2', {}, 'Record 23 resolved.');
  },
  notesEdit: (s) => {
    const n = s.fs.notes;
    const body = (n.content ?? '').replace(/Thu - *\n?$/, '');
    rewrite('notes', {
      content: body + 'Thu - counts agree now. 435 / 435.\n      nothing is missing.\n      do not close the review.\n',
      modified: '14/08/2008 03:14',
    }, 'Saved', s.user, '14/08/2008 03:14');
  },
  profileRename: (s) => {
    s.fs.profile.name = `${s.user}.DUNMORE`;
    s.shownUser = `${s.user} Dunmore`;
  },
  hideReview: (s) => {
    s.fs.lnk_review.parents = [];
  },
  lateMail: (s) => {
    const m = lateMail(makeCtx(s.user, s.fullName));
    s.fs[m.id] = m;
    balloon('Mail', 'You have 1 new e-mail message.', 'app:mail');
  },
  recentFake: (s) => {
    s.recent = [...EVIDENCE, ...s.recent.filter((r) => !EVIDENCE.includes(r))].slice(0, 12);
  },

  // ---------- Chapter 5: Understanding ----------
  ch5: (s) => {
    s.glitch = 3;
    s.edge = 3;
    for (const l of JOURNAL_END) s.flags.jl.push(l);
    hrsLog('The reviewer has read the journal.', 'Error');
    s.fs.lnk_review.parents = ['desktop'];
    after('appError', 8000);
    after('autoCrash', 5 * 60_000);
  },
  appError: () => {
    dialog('hrscont.exe - Application Error',
      'The instruction at "0x0412f0a3" referenced memory at "0x00000435". The memory could not be "read".\n\nClick on OK to terminate the program',
      'error', ['OK'], 'apperror', true);
    sfx('error');
  },
  appErrorRestart: (s) => {
    s.glitch = 3;
    hrsLog('The HRS Continuity Service service was successfully restarted.');
    journalLine('Restarted. The reviewer is still here.');
  },
  // The five-minute fuse waits while the reviewer is out on the side route. Close Archive Review
  // still brings the crash on at any time.
  autoCrash: (s) => {
    if (!sideBusy(s)) { climax('auto'); return; }
    s.fired = s.fired.filter((f) => f !== 'autoCrash');
    s.timers.push({ fx: 'autoCrash', at: s.playMs + 2 * 60_000 });
  },
});
