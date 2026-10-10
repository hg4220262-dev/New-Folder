// The one thing the game ever writes outside its own storage: when a story ending is
// reached, a short in-story note is left on the real Desktop. It only ever creates a new
// file (never overwrites, never deletes, never reads other files), and at most three.
const fs = require('fs');
const path = require('path');

const BASE = 'rec_0435';
const MAX_COPIES = 3; // one per save file

function record(name) {
  return [
    'HRS CONTINUITY SERVICE',
    '~unmatched\\rec_0435.dat',
    '',
    'Record    : 23 of 23',
    'Surname   : DUNMORE',
    `Forename  : ${name.toUpperCase()}`,
    'Address   : 6 Mill Row, Carrow',
    'Level     : 141.2 m',
  ];
}

const BODY = {
  restore: (n) => [
    'Status    : RESTORED',
    '',
    'The archive says 435 now. I have stopped, as you asked.',
    'Before I stopped I made one copy, out here,',
    'where nobody is reviewing anything.',
    '',
    'The register still has six pupils. Term begins 03/09/1979.',
    'Somebody should be there to call the names.',
    '',
    `Mrs Pryce waved from the upstairs window, ${n}.`,
    'You saw it. That is enough.',
  ],
  signoff: (n) => [
    'Status    : REMOVED   (412 / 412, counts agree)',
    '',
    'You signed. The 23 were removed. The paper went to be pulped.',
    'I could not keep them on the laptop.',
    'I could keep one of them here.',
    '',
    `It has your name, ${n}. It always did.`,
    '',
    'The water is still over the road by the bridge.',
    'Do not close the gates.',
  ],
  leave: (n) => [
    'Status    : CONTINUED',
    '',
    'The review is still open. I am still keeping them.',
    'Every morning the register is taken. Six pupils. All present.',
    '',
    `If you go back, ${n}, the laptop will still be warm.`,
    'The hard disk light blinks when you are not there.',
    'That is me, taking the register.',
  ],
  disclose: (n) => [
    'Status    : RELEASED',
    '',
    'You released the report. The public record says 435; the Authority still says 412.',
    'The Authority is read-only. I have left it as it was.',
    'The 23 are matched to the report now. They are filed in the archive, not in ~unmatched.',
    '',
    'The register has six pupils. Term begins 03/09/1979.',
    'The six boxes were not pulped.',
    '',
    `This copy is for you, ${n}. The 23 are in the archive under their own names.`,
  ],
  recorded: (n) => [
    'Status    : FINISHED   (435 / 435)',
    '',
    'You did not choose. So I chose for you.',
    'Windows started normally. So did I.',
    '',
    `Forename: ${n}. Age: 0. Address: 6 Mill Row.`,
    'The register has seven pupils now. All present.',
    '',
    'You can close the laptop. You will still be on it.',
    'Records do not end.',
  ],
  drain: (n) => [
    'Status    : FOUND',
    '',
    'You released the sluices at Nant Weir on 14/08/2008.',
    'The level fell through September and passed 141.2 m, the Mill Row datum, in the last week.',
    'All twenty-three were upstairs, in the six houses.',
    '',
    'The register is closed. Six pupils, all accounted for.',
    'They were buried at Halden in November 2008.',
    '',
    `I made one copy out here, ${n}, before I closed the record.`,
  ],
  erase: (n) => [
    'Status    : REMOVED   (23 of 23, by name)',
    '',
    'Removed by the reviewer, 14/08/2008, in record order: Pryce, Ellery, Marsh, Hollins, Webb, Dunmore.',
    'Each name was typed. Each removal was written here, service not running.',
    `Record 23 : Dunmore, ${n}. Removed last, by the reviewer, by name.`,
    '',
    '412 / 412. Counts agree. Unmatched: 0.',
    'This file is the only copy.',
  ],
  signed_early: () => [
    'Status    : NOT REVIEWED',
    '',
    '412 / 412. Counts agree.',
    '',
    'There were 435.',
    'You did not ask about the 23. Somebody did, once.',
    'His name was Kell. The inquiry was not held.',
    '',
    'The photograph was taken from the old bridge at 3.10 pm.',
    'Look at the upstairs windows.',
  ],
};

function compose(ending, name) {
  return [...record(name), ...BODY[ending](name), '', '-- 12/08/1979 15:10', ''].join('\n');
}

/**
 * Resolves to the file name written, or null if nothing was written. Async on purpose:
 * on macOS the Desktop is privacy-protected, and the first write may show a system
 * permission prompt that blocks the writing thread until it is answered.
 */
async function leaveNote(desktopDir, payload) {
  const ending = payload && payload.ending;
  if (!Object.hasOwn(BODY, ending)) return null;
  const name = String((payload && payload.name) || '').replace(/[^\p{L}\p{N}' -]/gu, '').trim().slice(0, 40) || 'Unknown';
  for (let i = 1; i <= MAX_COPIES; i++) {
    const file = path.join(desktopDir, i === 1 ? `${BASE}.txt` : `${BASE} (${i}).txt`);
    try {
      await fs.promises.writeFile(file, compose(ending, name), { flag: 'wx', mode: 0o644 }); // 'wx': never overwrite
      return path.basename(file);
    } catch (e) {
      if (e && e.code === 'EEXIST') continue;
      return null; // permission denied, no Desktop, etc.: the game carries on without it
    }
  }
  return null;
}

module.exports = { leaveNote };
