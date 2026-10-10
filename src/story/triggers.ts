import { onStory, once, fired, setChapter, whenUnseen, hrsLog, journalLine, after, balloon } from '../engine/director';
import type { State } from '../engine/state';
import { dialog } from '../engine/windows';
import { sfx } from '../engine/bus';
import type { GameEvent } from '../engine/types';
import { climax, earlyEnding, chooseEnding } from './climax';
import './beats1';
import { EVIDENCE } from './beats2';
import './hints';

const base = (name: string) => name.toLowerCase().replace(/\.[a-z0-9]{2,4}$/i, '').trim();

function restoreByName(s: State, id: string, to: string) {
  const n = s.fs[id];
  if (!n?.origName || !n.restore || s.flags[`restored_${id}`]) return;
  if (base(to) !== base(n.origName)) return;
  Object.assign(n, n.restore);
  n.name = n.origName;
  n.hidden = false;
  n.versions = [...(n.versions ?? []), { date: '—', author: 'SYSTEM', note: 'Original name restored. Original content restored.' }];
  s.flags[`restored_${id}`] = true;
  hrsLog(`Reviewer restored ${n.origName}.`, 'Warning');
  journalLine(`Reviewer restored ${n.origName}\nby typing its name. Names are how records are kept.`);
  sfx('ding');
}

function checkConflict(s: State) {
  if (!s.flags.restored_scan412 || fired('conflict')) return;
  const photo = s.fs.scan412, log = s.fs.gatelog;
  if (photo.parents.some((p) => log.parents.includes(p) || s.fs.levels.parents.includes(p))) once('conflict');
}

function maybeCh2(s: State) {
  const o = s.opened;
  if (s.chapter < 2 && o.includes('census') && o.includes('reloc')) setChapter(2);
}

function maybeCh4(s: State) {
  if (s.chapter !== 3) return;
  const clues = [s.flags.restored_regp2 && s.opened.includes('regp2'), fired('conflict'), s.flags.readKell, s.opened.includes('mr1'), s.flags.assembled, s.flags.assembledKell, s.flags.readMemo].filter(Boolean).length;
  if (clues >= 2) setChapter(4);
}

onStory((s, e: GameEvent) => {
  switch (e.t) {
    case 'open': {
      maybeCh2(s);
      if (e.id === 'scan412_vis') whenUnseen('tidyPhoto', ['scan412_vis', 'f_photos'], 1500);
      // Reading the service's own journal is the moment of understanding.
      if (e.id === 'journal') setChapter(5);
      if (e.id === 'hrsini') setChapter(3);
      if (e.id === 'adm_memo') s.flags.readMemo = true;
      maybeCh4(s);
      break;
    }
    case 'view': {
      if (e.id === 'unm') setChapter(3);
      if (e.id === 'f_photos' && s.chapter >= 2) whenUnseen('tidyPhoto', ['scan412_vis', 'f_photos'], 1500);
      break;
    }
    case 'rename': {
      restoreByName(s, e.id, e.to);
      checkConflict(s);
      maybeCh4(s);
      if (e.id === 'cert' && s.chapter >= 3) { s.fs.cert.name = e.from; hrsLog('Authority document cannot be renamed. Change reverted.', 'Warning'); }
      break;
    }
    case 'move': checkConflict(s); maybeCh4(s); break;
    case 'delete': {
      if (EVIDENCE.includes(e.id) && s.chapter >= 3) {
        journalLine(`Reviewer moved ${s.fs[e.id].name} to the Recycle Bin.\nRestored. Records do not end.`);
        const n = s.fs[e.id];
        n.parents = n.binFrom ?? ['unm'];
        delete n.binFrom;
        balloon('HRS Archive Assistant', `${n.name} could not be deleted and was restored.`, undefined, s.chapter >= 3);
      }
      break;
    }
    case 'hidden': {
      if (e.on && !s.flags.hiddenOnce) { s.flags.hiddenOnce = true; hrsLog('Folder view settings were changed by the user.', 'Warning'); }
      break;
    }
    case 'cmd': {
      const l = e.line.toLowerCase();
      if (/\btype\b.*kell/.test(l)) { s.flags.readKell = true; maybeCh4(s); }
      if (/\btype\b.*journal/.test(l)) setChapter(5);
      if (/\btype\b.*continuity/.test(l)) setChapter(3);
      if (/(taskkill|tskill).*hrscont|(sc|net) +stop +hrs/.test(l)) stopService(s, 'cmd');
      break;
    }
    case 'endtask': if (e.name.toLowerCase() === 'hrscont.exe') stopService(s, 'taskmgr'); break;
    case 'action': handleAction(s, e.id, e.button); break;
  }
});

function stopService(s: State, how: string) {
  if (s.chapter < 5) {
    dialog('Unable to Terminate Process', 'The operation could not be completed.\n\nAccess is denied.', 'error');
    sfx('error');
    hrsLog('An attempt to stop the service was refused. The reviewer is not finished.', 'Warning');
    return;
  }
  climax(how);
}

function handleAction(s: State, id: string, button?: string) {
  if (id === 'review') {
    if (s.chapter >= 5) { climax('review'); return; }
    const unmatched = 23;
    dialog('Close Archive Review',
      `Archive: C:\\HRS\\Carrow\nReviewer: ${s.fullName}\n\nCensus total (Authority):  412\nResidents rehoused:        412   ✓ Counts agree\nUnmatched records:          ${unmatched}   (will be removed)\n\nSign off this archive as complete and accurate? The paper originals will be destroyed.`,
      'question', ['Sign Off', 'Cancel'], 'review_confirm');
    return;
  }
  if (id === 'review_confirm' && button === 'Sign Off') {
    if (s.chapter >= 4) {
      dialog('Close Archive Review', 'The review could not be closed.\n\nRecord 23 is still open.', 'error');
      sfx('error');
      return;
    }
    earlyEnding();
    return;
  }
  if (id === 'release_confirm' && button === 'Publish') {
    if (s.flags.assembled) chooseEnding('disclose');
    return;
  }
  if (id === 'apperror') {
    hrsLog('The HRS Continuity Service service terminated unexpectedly. It has done this 1 time(s). The following corrective action will be taken: Restart the service.', 'Error');
    s.glitch = 4;
    after('appErrorRestart', 4000);
  }
}
