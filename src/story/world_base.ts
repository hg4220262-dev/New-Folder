import type { FNode } from '../engine/types';
import { n, type Ctx } from './ctx';

/** Roots, drives, Windows folders and the player's own personal files. */
export function baseNodes(c: Ctx): FNode[] {
  const old = { created: '02/09/2006 18:21', modified: '02/09/2006 18:21' };
  return [
    n('desktop', 'Desktop', 'folder', ['profile'], old),
    n('mycomp', 'My Computer', 'computer', ['desktop'], old),
    n('mydocs', 'My Documents', 'folder', ['desktop', 'profile'], old),
    n('bin', 'Recycle Bin', 'bin', ['desktop'], old),
    n('c', 'Local Disk (C:)', 'drive', ['mycomp'], old),
    n('d', 'CD Drive (D:)', 'drive', ['mycomp'], old),
    n('control', 'Control Panel', 'folder', ['mycomp'], old),
    n('cp_folder', 'Folder Options.lnk', 'lnk', ['control'], { ...old, target: 'app:folderopts' }),
    n('cp_admin', 'Administrative Tools', 'folder', ['control'], old),
    n('cp_events', 'Event Viewer.lnk', 'lnk', ['cp_admin'], { ...old, target: 'app:events' }),
    n('cp_tasks', 'Task Manager.lnk', 'lnk', ['cp_admin'], { ...old, target: 'app:taskmgr' }),

    // Desktop shortcuts
    n('lnk_carrow', 'Carrow Archive.lnk', 'lnk', ['desktop'], { target: 'carrow', created: '11/08/2008 09:41' }),
    n('lnk_review', 'Close Archive Review.lnk', 'lnk', ['desktop'], { target: 'app:review', created: '11/08/2008 09:41' }),
    n('lnk_ie', 'Internet Explorer.lnk', 'lnk', ['desktop'], { target: 'app:ie', created: '11/08/2008 09:41' }),
    n('lnk_mail', 'Mail.lnk', 'lnk', ['desktop'], { ...old, target: 'app:mail' }),

    // C:\
    n('docset', 'Documents and Settings', 'folder', ['c'], old),
    n('profile', c.user, 'folder', ['docset'], old),
    n('localset', 'Local Settings', 'folder', ['profile'], { ...old, hidden: true }),
    n('mailstore', 'Mail', 'folder', ['localset'], old),
    n('inbox', 'Inbox', 'folder', ['mailstore'], old),
    n('sent', 'Sent Items', 'folder', ['mailstore'], old),
    n('progfiles', 'Program Files', 'folder', ['c'], old),
    n('pf_hrs', 'HRS Archive Tools', 'folder', ['progfiles'], { created: '11/08/2008 09:38', modified: '11/08/2008 09:38' }),
    n('pf_readme', 'readme.txt', 'txt', ['pf_hrs'], {
      created: '11/08/2008 09:38', modified: '11/08/2008 09:38',
      content: `HRS Archive Tools 2.1\r\nHalden Records Services Ltd.\r\n\r\nIncludes:\r\n  - Archive Assistant (suggests related records)\r\n  - Record History (Properties tab)\r\n  - Continuity Service (keeps scanned records consistent)\r\n\r\nThe Continuity Service runs in the background. Do not stop it\r\nwhile a review is open.\r\n\r\nWeb access is filtered while a review is open. Administrators manage the\r\nfilter with the HRSFILTER command (run HRSFILTER with no arguments for\r\nusage). Filter settings are kept with the Archive Assistant.\r\n\r\nUnmatched scans are hidden automatically and removed when the\r\nreview is signed off.\r\n`,
    }),
    n('hscjoin', 'hscjoin.exe', 'exe', ['pf_hrs'], { created: '11/08/2008 09:38', modified: '11/08/2008 09:38', size: 143_360, target: 'app:joiner', comments: 'HSC Join Utility. Puts downloaded blocks back together.' }),
    n('hsc_ini', 'hsc.ini', 'ini', ['pf_hrs'], { created: '11/08/2008 09:38', modified: '11/08/2008 09:38', content: '; HRS Storage Cluster client 2.1\r\n[Cluster]\r\nNameNode=hsc.haldenrecords.co.uk:50070\r\n; Status page: http://hsc.haldenrecords.co.uk:50070/ (Internet Explorer)\r\nUser=reviewer\r\n; Password: not stored. See your IT welcome e-mail.\r\nReplication=3\r\nBlockSize=64MB\r\nTimeout=30\r\n\r\n[Download]\r\nFolder=My Documents\\HSC Downloads\r\n; Blocks are joined locally with hscjoin.exe, in block order.\r\n' }),
    n('win', 'WINDOWS', 'folder', ['c'], old),
    n('sys32', 'system32', 'folder', ['win'], old),
    n('x_cmd', 'cmd.exe', 'exe', ['sys32'], { ...old, target: 'app:cmd', size: 389120 }),
    n('x_note', 'notepad.exe', 'exe', ['win', 'sys32'], { ...old, target: 'app:notepad', size: 69120 }),
    n('x_ev', 'eventvwr.exe', 'exe', ['sys32'], { ...old, target: 'app:events', size: 56832 }),
    n('x_tm', 'taskmgr.exe', 'exe', ['sys32'], { ...old, target: 'app:taskmgr', size: 136704 }),
    n('x_wp', 'wordpad.exe', 'exe', ['win'], { ...old, target: 'app:wordpad', size: 205824 }),
    n('win_ini', 'win.ini', 'ini', ['win'], { ...old, content: '; for 16-bit app support\r\n[fonts]\r\n[extensions]\r\n[mci extensions]\r\n[files]\r\n[Mail]\r\nMAPI=1\r\n' }),
    n('bootini', 'boot.ini', 'ini', ['c'], { ...old, hidden: true, system: true, content: '[boot loader]\r\ntimeout=30\r\ndefault=multi(0)disk(0)rdisk(0)partition(1)\\WINDOWS\r\n[operating systems]\r\nmulti(0)disk(0)rdisk(0)partition(1)\\WINDOWS="Windows XP Home Edition" /fastdetect\r\n' }),
    n('pagefile', 'pagefile.sys', 'dat', ['c'], { ...old, hidden: true, system: true, size: 805306368 }),

    // My Documents (the player's own life, 2006-2008)
    n('mypics', 'My Pictures', 'folder', ['mydocs'], old),
    n('mymusic', 'My Music', 'folder', ['mydocs'], old),
    n('pic_beach', 'whitby_july07.jpg', 'img', ['mypics'], { created: '22/07/2007 16:02', modified: '22/07/2007 16:02', art: 'seaside', comments: '' }),
    n('pic_flat', 'new flat!!.jpg', 'img', ['mypics'], { created: '03/03/2008 11:15', modified: '03/03/2008 11:15', art: 'flat', comments: '' }),
    n('cv', `CV_${c.surname}_2008.doc`, 'doc', ['mydocs'], {
      created: '19/06/2008 21:40', modified: '04/08/2008 22:03', author: c.full,
      content: `# ${c.full}\n\nCurriculum Vitae\n\n## Recent work\n\nHalden Records Services Ltd. (temporary, from August 2008)\nArchive review assistant. Checking digitised records against originals before disposal.\n\nCity Library, Saturday assistant (2006 to 2008)\n\n## Skills\n\nTyping 60 wpm. Microsoft Office. Patient with old handwriting.\n`,
    }),
    n('budget', 'money aug.xls', 'xls', ['mydocs'], {
      created: '01/08/2008 20:11', modified: '13/08/2008 21:47',
      rows: [['Item', 'Amount'], ['Rent', '£325.00'], ['Phone', '£15.00'], ['Bus pass', '£42.00'], ['Food', '£120.00'], ['HRS (2 weeks)', '-£460.00'], ['Left', '-£42.00']],
    }),
    n('notes', 'notes.txt', 'txt', ['mydocs', 'desktop'], {
      created: '11/08/2008 09:52', modified: '13/08/2008 17:31', author: c.user,
      content: NOTES_V1,
      versions: [],
    }),
  ];
}

const NOTES_V1 = `HRS job - Carrow archive
------------------------
Diane: check the counts agree, then run Close Archive Review.
Due Fri 15th.

Mon - indexed admin + photos. scanner software keeps "tidying"
      things. if anything goes missing check the Recycle Bin.

Tue - census says 435. relocation list says 412??
      emailed Diane.

Wed - Diane says unmatched scans get hidden by the HRS software
      and "not to worry about them".
      (Tools > Folder Options > View > Show hidden files)
      I am worrying about them.

      explorer doesn't show everything. cmd does: dir /a

Thu - 
`;

/** The same file, three laptops ago. Each stops where its writer was reassigned. */
export const PREVIOUS_NOTES = [
  { date: '27/02/2008 08:52', author: 't.brandt', note: 'Retained at reissue.', name: 'notes.txt', content: `CARROW ARCHIVE (HRS, 3 wks)
Diane - counts to agree, then "Close Archive Review" on the desktop. Fri 29th.

Tue 12 - indexed admin + census. census 435 rows. relocation list 412.
         storage cluster, settings in hsc.ini. the Board's own report is on it,
         5 blocks. got 1.
Thu 14 - asked Diane about the 23. "unmatched scans get hidden, standard." got 3.
Mon 18 - read 1 and 3. the 12th: Mill Row not moved.
Fri 22 - cluster page: plant room rack keeps dropping. 2, 4, 5 next week.
Tue 26 - wrote to Diane, not sent yet.
Wed 27 - 
` },
  { date: '10/06/2008 08:47', author: 's.okafor', note: 'Retained at reissue.', name: 'notes.txt', content: `Carrow - HRS
------------
Diane says the last reviewer left. Files already indexed, which is odd.

Tue 3 - 435 / 412. asked for the Board minutes. "not in scope."
        cluster: tried blocks 1 and 5 from the plant room rack. both time out.
        rack 2 no heartbeat.
Fri 6 - Properties > Record History on Relocation Summary: SYSTEM edit, 435 -> 412.
Mon 9 - sent Diane the history tab as a screenshot.
Tue 10 - 
` },
  { date: '04/07/2008 15:43', author: 'm.price', note: 'Retained at reissue.', name: 'notes.txt', content: `Carrow review
-------------
Mon 30 - started. 435 / 412. not emailing anyone this time.
Tue 1 - blocks 1 2 3 4 from racks 1 and 3. block 5: dn-32 is slow, keep trying.
Wed 2 - IT in for the laptop audit. Aldous has gone, the new one keeps the admin
        password on a yellow note under his keyboard. copied it.
Thu 3 - dn-32 still slow. read 1 to 4 on their own. block 4: 23 people were in the houses.
Fri 4 - 15.41 block 5 down. all five. joining now, printing it befo` },
];
