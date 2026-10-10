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
      content: `HRS Archive Tools 2.1\r\nHalden Records Services Ltd.\r\n\r\nIncludes:\r\n  - Archive Assistant (suggests related records)\r\n  - Record History (Properties tab)\r\n  - Continuity Service (keeps scanned records consistent)\r\n\r\nThe Continuity Service runs in the background. Do not stop it\r\nwhile a review is open.\r\n\r\nWeb access is filtered while a review is open. Administrators manage the
filter with the HRSFILTER command. Its settings are kept with the service.\r\n\r\nUnmatched scans are hidden automatically and removed when the\r\nreview is signed off.\r\n`,
    }),
    n('hscjoin', 'hscjoin.exe', 'exe', ['pf_hrs'], { created: '11/08/2008 09:38', modified: '11/08/2008 09:38', size: 143_360, target: 'app:joiner', comments: 'HSC Join Utility. Puts downloaded blocks back together.' }),
    n('hsc_ini', 'hsc.ini', 'ini', ['pf_hrs'], { created: '11/08/2008 09:38', modified: '11/08/2008 09:38', content: '; HRS Storage Cluster client\r\n[Cluster]\r\nNameNode=hsc.haldenrecords.co.uk:50070\r\nUser=reviewer\r\n; Password: see your IT welcome e-mail\r\nReplication=3\r\nBlockSize=64MB\r\n; Downloaded blocks are joined with hscjoin.exe\r\n' }),
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
