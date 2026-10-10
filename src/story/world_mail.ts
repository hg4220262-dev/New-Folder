import type { FNode } from '../engine/types';
import { n, type Ctx } from './ctx';
import { PUPILS } from './people';

const DIANE = 'Diane Carver <d.carver@haldenrecords.co.uk>';
export const mailAddr = (c: Ctx) => `${c.user.toLowerCase()}.${c.surname.toLowerCase()}@mailbox.co.uk`;
export const meAddr = (c: Ctx) => `${c.full} <${mailAddr(c)}>`;

export function mail(id: string, folder: string, from: string, to: string, date: string, subject: string, content: string, unread = false, extra: Partial<FNode> = {}): FNode {
  return n(id, `${subject.replace(/[\\/:*?"<>|]/g, '')}.eml`, 'eml', [folder], {
    created: date, modified: date, mail: { from, to, date, subject, unread }, content, ...extra,
  });
}

export function mails(c: Ctx): FNode[] {
  const me = meAddr(c);
  return [
    mail('m0', 'inbox', 'HRS IT <it@haldenrecords.co.uk>', me, '08/08/2008 09:20', 'Welcome to Halden Records - your accounts',
      `Hi ${c.user},\n\nYour laptop is ready for Monday. Details below.\n\n  - Windows login: your own account (no password set)\n  - Mail: ${mailAddr(c)}\n  - HRS Archive Tools 2.1: starts with the laptop\n  - Storage cluster client (only if Diane asks you to pull records): user reviewer, password bluefinch42\n\nPlease do not share these. The laptop comes back to IT on your last day.\n\nIT Support\nHalden Records Services Ltd.`),
    mail('m1', 'inbox', DIANE, me, '08/08/2008 16:20', 'Carrow archive - your first job',
      `Hi ${c.user},\n\nWelcome to Halden Records! As discussed, your first job is the Wendell Water Board archive for Carrow. The boxes have been scanned and the files are on your laptop under C:\\HRS\\Carrow (there's a shortcut on the desktop).\n\nAll you need to do is check that the records agree with each other, especially the counts, and then run "Close Archive Review" on the desktop to sign it off. Once you sign off, the paper originals go for pulping and the digital copy becomes the official record.\n\nThe HRS software does most of the work. It suggests related files and tidies the archive as you go, so don't be alarmed if things move around a bit.\n\nDeadline is Friday 15th.\n\nThanks,\nDiane\n\nDiane Carver\nHalden Records Services Ltd.`),
    mail('m2', 'sent', me, DIANE, '12/08/2008 18:02', 'RE: Carrow - numbers don\'t match',
      `Hi Diane,\n\nThe 1978 census has 435 people but the relocation list only has 412, and the certificate says 412 too. Where did 23 people go?\n\nAlso a few files have moved on their own and one changed its name. Is that normal?\n\n${c.user}`),
    mail('m3', 'inbox', DIANE, me, '13/08/2008 09:14', 'RE: Carrow - numbers don\'t match',
      `Hi ${c.user},\n\nThe software marks scans that don't match the certificate as "unmatched" and hides them so the review isn't cluttered. It's standard, and they're removed at sign-off anyway.\n\nIt's 30 years ago and the certificate is the official document. Please don't spend time on it. Just check the counts agree and sign off.\n\nD`),
    mail('adm1', 'inbox', 'R. Hale <r.hale@haldenrecords.co.uk>', DIANE, '13/08/2008 18:40', 'Carrow - status?',
      `Hi Diane,\n\nWhere are we with Carrow? Wendell Utilities rang again today. Disposal is booked for Monday and finance want the final invoice out the same week.\n\nIf the temp has questions, remind them the Certificate is the official record.\n\nThanks,\nR.`, false, { adminOnly: true }),
    mail('adm2', 'inbox', 'HRS IT <it@haldenrecords.co.uk>', 'Administrator <admin@haldenrecords.co.uk>', '11/08/2008 09:30', 'Temp laptops: filter and service',
      `Admin notes for reviewer laptops (HRS Archive Tools 2.1 build):\n\n  - hrscont.exe (Continuity Service): system service, starts with the laptop. Do not stop it while a review is open.\n  - hrsassist.exe (Archive Assistant): web filter ON by default.\n  - Reviewer account policy: Task Manager and Event Viewer disabled.\n  - Service Console (Administrator desktop): service status, web filter on/off, reviewer restrictions, storage cluster link.\n  - Storage cluster: NameNode hsc.haldenrecords.co.uk:50070. Rack 2 (Plant Room) switch not responding since March. Power-cycle from the console if a fetch times out.\n\nPlease log off the Administrator account when you have finished. Do not leave the console open on a reviewer's laptop.\n\nIT`, false, { adminOnly: true }),
    mail('m4', 'inbox', 'HRS Archive Assistant <noreply@haldenrecords.co.uk>', me, '14/08/2008 07:00', 'Reminder: Close Archive Review due tomorrow',
      `This is an automatic reminder.\n\nArchive: C:\\HRS\\Carrow\nReviewer: ${c.full}\nStatus: Counts agree (412 / 412)\n\nPlease run Close Archive Review on your desktop.\n\nWhen the review is closed, unmatched records will be removed and the archive will be locked.`, true),
  ];
}

/** Extra mail that appears in chapter 4, addressed from the archive itself. */
export function lateMail(c: Ctx): FNode {
  return mail('m5', 'inbox', 'Carrow Archive <continuity@localhost>', `${c.full}`, '12/08/1979 15:10', `Record 23`,
    `Record 23 had no name.\n\nYou opened every file. You counted. You were the only one who looked for us.\n\nThe record is complete now. 435 / 435.\n\nPlease do not close the review.`, true,
    { unsearchable: true });
}

export function schoolRegister(c: Ctx, withYou: boolean): string {
  const names = [...PUPILS, ...(withYou ? [`Dunmore, ${c.user}`] : [])];
  const rows = names.map((p, i) => `${String(i + 1).padStart(2)}  ${p.padEnd(22)}  /  /  /  /  /`).join('\r\n');
  return `CARROW SCHOOL - ATTENDANCE REGISTER
Autumn Term 1979   (from 3 September 1979)
Teacher: Miss E. Ellery

No. Name                    M  T  W  T  F
--------------------------------------------
${rows}
--------------------------------------------
Present: ${names.length}   Absent: 0

Note: term begins 3 September 1979.
`;
}
