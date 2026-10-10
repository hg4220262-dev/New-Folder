import type { FNode } from '../engine/types';
import { n, scan, type Ctx } from './ctx';
import { mail, meAddr } from './world_mail';

const doc =(id: string, name: string, parent: string, box: string, content: string, extra: Partial<FNode> = {}) =>
  n(id, name, 'doc', [parent], { ...scan, comments: box, content, ...extra });
const sheet = (id: string, name: string, parent: string, box: string, rows: string[][], extra: Partial<FNode> = {}) =>
  n(id, name, 'xls', [parent], { ...scan, comments: box, rows, ...extra });
const text = (id: string, name: string, parent: string, box: string, content: string, extra: Partial<FNode> = {}) =>
  n(id, name, 'txt', [parent], { ...scan, comments: box, content, ...extra });
const photo = (id: string, name: string, art: string, comments: string, taken: string) =>
  n(id, name, 'img', ['f_photos'], { ...scan, art, comments, created: '11/08/2008 11:06', modified: taken });

/** More of the Carrow archive: the ordinary paperwork of a village being moved. */
export function extraArchive(): FNode[] {
  const aug = Array.from({ length: 14 }, (_, i) => {
    const d = i + 1;
    const mm = [0, 0, 0, 1.2, 0.4, 0, 0, 0.6, 0, 2.2, 1.1, 18.5, 22.4, 14.8][i];
    return [`${String(d).padStart(2, '0')}/08/1979`, String(mm), d === 12 ? 'Heavy rain on the hills from 08:00' : d === 13 ? 'Continuing' : ''];
  });
  return [
    // ---- 01 Administration
    doc('press', 'Press Release Feb 1978.doc', 'f_admin', 'Box 1 / Item 3', `# WENDELL WATER BOARD

## Press release. For immediate publication. 9 February 1978

The Chairman of the Wendell Water Board, Mr H. Wendell-Price, today confirmed that work on the **Carrow Reservoir Scheme** will begin in the spring.

"Carrow will be remembered," said Mr Wendell-Price. "Every household will be offered a better home, and no family will be asked to leave until its new house is ready."

The Board's new estate at Halden Park will provide 104 homes with electricity, bathrooms and gardens. Residents who prefer to make their own arrangements will receive a grant towards their costs.

> Issued by the Board's Information Officer, Halden.`),
    sheet('comp', 'Compensation Scale 1978.xls', 'f_admin', 'Box 1 / Item 5', [
      ['Household', 'Removal grant', 'Disturbance', 'Notes'],
      ['Single person', '£120', '£80', ''],
      ['Couple', '£165', '£110', ''],
      ['Family (1-2 children)', '£210', '£140', ''],
      ['Family (3+ children)', '£260', '£180', 'Pro rata over 5'],
      ['Elderly (over 70)', '£190', '£160', 'Ground-floor house at Halden Park'],
      ['Mill Row (6 households)', 'see Housing', 'see Housing', 'Referred to Mr Amory, 3/78'],
    ]),
    sheet('staff', 'Staff Directory 1979.xls', 'f_admin', 'Box 1 / Item 7', [
      ['Name', 'Post', 'Extension', 'Notes'],
      ['H. Wendell-Price', 'Chairman', '1', ''],
      ['J. Amory', 'Housing Officer', '14', ''],
      ['R. Kell', 'Engineer', '22', 'Out of office most days. Try the weir.'],
      ['M. Hughes', 'Clerk to the Board', '3', ''],
      ['E. Rowley', 'Weir keeper, Nant Weir', '(call box)', 'Telephone via the exchange'],
      ['B. Lloyd', 'Information Officer', '9', ''],
    ]),
    // ---- 02 Census
    text('enum', 'Enumerator Notes.txt', 'f_census', 'Box 2 / Item 3',
      'CENSUS 1978. ENUMERATOR NOTES (extracts)\r\n\r\nHigh Street: good response. Two houses empty (Nos. 9 and 22).\r\nChurch Lane: old Mr Bevan would not answer the door. Counted from the\r\n  neighbours.\r\nChapel Row: all present.\r\nMill Row: lowest houses in the village. Water in the lane in the winter of\r\n  1947 and again in 1960. Residents cheerful. No. 6: Mrs Dunmore expecting\r\n  a baby in the autumn. To be added by hand when born.\r\nStation Road: two farms returned late.\r\n\r\nTotal for the Board: see summary sheet.\r\n'),
    sheet('chapel', 'Chapel Roll 1978.xls', 'f_census', 'Box 2 / Item 5', [
      ['Name', 'Pew', 'Joined', 'Notes'],
      ['Mrs E. Ellery', '12', '1931', 'Organist'],
      ['Mr W. Marsh', '14', '1939', 'Deacon'],
      ['Mr H. Webb', '15', '1946', ''],
      ['Mrs A. Pryce', '9', '1960', 'Sunday school'],
      ['Mr & Mrs M. Dunmore', '11', '1975', 'Married at Bethel, June 1975'],
      ['Rev. D. Parry', '-', '1969', 'Minister'],
    ]),
    // ---- 03 Relocation
    sheet('sched', 'Removal Schedule August 1979.xls', 'f_reloc', 'Box 3 / Item 4', [
      ['Date', 'Street', 'Households', 'Lorries', 'Note'],
      ['02/08/1979', 'Station Road', '9', '2', ''],
      ['04/08/1979', 'Back Lane', '8', '2', ''],
      ['06/08/1979', 'School Lane', '10', '2', ''],
      ['08/08/1979', 'Church Lane', '12', '3', ''],
      ['09/08/1979', 'Chapel Row', '11', '2', ''],
      ['10/08/1979', 'High Street (north)', '14', '3', ''],
      ['11/08/1979', 'High Street (south)', '16', '3', 'Last day of the main removal'],
      ['13/08/1979', 'Mill Row', '6', '1', 'Last. Houses at Halden Park to be ready. See MR-1.'],
    ]),
    sheet('tenancy', 'Halden Park Tenancies.xls', 'f_reloc', 'Box 3 / Item 6', [
      ['House', 'Tenant', 'Moved in', 'Rent (wk)'],
      ['95', 'Hughes, M. & family', '09/08/1979', '£4.10'],
      ['96', 'Owens, D. & family', '10/08/1979', '£4.10'],
      ['97', 'Pryce, T. & family', '13/08/1979', '£4.10'],
      ['98', 'Ellery, G. & family', '13/08/1979', '£4.10'],
      ['99', 'Marsh, W. & family', '13/08/1979', '£4.10'],
      ['100', 'Hollins, D. & family', '13/08/1979', '£4.10'],
      ['101', 'Webb, H. & Mrs', '13/08/1979', '£4.10'],
      ['102', 'Dunmore, M. & family', '13/08/1979', '£4.10'],
      ['103', '(vacant)', '', ''],
      ['104', '(vacant)', '', ''],
    ], { created: '11/08/2008 10:21', modified: '11/08/2008 10:21' }),
    doc('invoice', 'Removal Contractor Invoice.doc', 'f_reloc', 'Box 3 / Item 8', `# EVANS & SONS, HAULIERS

## Invoice No. 1187. Wendell Water Board. 14 August 1979

For removal of household goods, Carrow to Halden Park and other addresses, 2 to 11 August 1979:

- 74 households
- 14 lorries, 3 days each
- Labour: 6 men

**Total £3,918.00**

Note: the Board's instruction to hold one lorry and two men for 13 August at Mill Row was **cancelled by telephone on the 12th**. No charge made.

> Evans & Sons, Halden.`),
    // ---- 04 Photographs
    photo('p_fete', 'Carrow Fete 1977.jpg', 'fete', 'Carrow summer fete on the green, July 1977.', '11/08/2008 11:06'),
    photo('p_bridge', 'The old bridge.jpg', 'bridge', 'The old bridge over the Nant, 1978.', '11/08/2008 11:06'),
    photo('p_weir', "Weir keeper's cottage.jpg", 'weir', "Nant Weir. The keeper's cottage and the sluice gates, 1979. A kingfisher is painted on the station door.", '11/08/2008 11:07'),
    photo('p_farm', 'Top Farm.jpg', 'farm', 'Top Farm, summer 1977.', '11/08/2008 11:07'),
    photo('p_chapin', 'Bethel Chapel interior.jpg', 'chapin', 'Interior of Bethel Chapel, 1978.', '11/08/2008 11:08'),
    // ---- 05 Engineering
    sheet('rain', 'Rainfall Records 1979.xls', 'f_eng', 'Box 5 / Item 2', [['Date', 'Rainfall (mm)', 'Notes'], ...aug]),
    doc('weirops', 'Weir Operating Instructions.doc', 'f_eng', 'Box 5 / Item 4', `# NANT WEIR. OPERATING INSTRUCTIONS

## Issued by the Engineer. Revised June 1979

1. The sluice gates are to be raised or lowered only on the **written instruction of the Engineer**.
2. The gates will not be closed for impounding until the Engineer has certified in writing that the valley below the top water level is clear of residents.
3. In an emergency the keeper may telephone the Engineer at the Board office. If he cannot be reached, the keeper is to leave the gates open.
4. The keeper will record gate positions and water levels every hour in the log.

> R. Kell, Engineer.`),
    text('kellnotes', 'Valley Survey Notes.txt', 'f_eng', 'Box 5 / Item 6',
      'R. KELL. SURVEY NOTES (field book, copied)\r\n\r\nMill Row stands lowest of any dwellings. 141.2 m. The lane flooded to 0.6 m in\r\nthe winter of 1947. A good wet week would reach the doorsteps.\r\n\r\nMy advice to the Board stands: no closure until Mill Row is empty. I have\r\nsaid it at the March meeting and I will say it again.\r\n\r\nChapel at 144.1 and the school at 147.5 are safe until the reservoir is\r\nwell up.\r\n'),
    // ---- 06 Correspondence
    doc('pryce', 'Letter from Mrs Pryce.doc', 'f_corr', 'Box 6 / Item 5', `# 1 Mill Row, Carrow

## 28 July 1979

Dear Mr Amory,

I am writing again about the day we are to be moved. Mr Pryce was told the 13th, and then somebody said it might be earlier. I have the children's school things to get ready and the baby's cot has to be taken down.

The little ones keep asking when the lorry is coming. Mary says she does not want to leave her bedroom window because she can see the river from it.

Please would you let me know the day for certain.

Yours sincerely,

*Ann Pryce*`),
    doc('amory', 'Reply to Mrs Pryce.doc', 'f_corr', 'Box 6 / Item 6', `# WENDELL WATER BOARD

## Housing Department. 2 August 1979

Dear Mrs Pryce,

Thank you for your letter. Mill Row will be moved on **13 August**, the last day of the removal. Your new house at Halden Park will be ready for you.

Please be ready to leave at eight o'clock in the morning. A lorry and two men will come to you.

Yours faithfully,

*J. Amory*, Housing Officer`),
    doc('kestrel', 'Kestrel Letter Aug 1979.doc', 'f_corr', 'Box 6 / Item 9', `# KESTREL CIVIL ENGINEERING LTD.

## 7 August 1979. To the Chairman

Dear Mr Wendell-Price,

We have the full gang and the plant on site at Nant Weir and the forecast for the 12th is good. We assume the Board will confirm that **impounding will begin by the 12th without fail**, as discussed.

Any later start puts the autumn completion, and the bonus, at risk for both of us.

Yours sincerely,

*P. Garrow*, Contracts Manager`),
    doc('cuttings', 'Press Cuttings 1979.doc', 'f_corr', 'Box 6 / Item 11', `# HALDEN COURIER. CUTTINGS

## 14 August 1979

**CARROW SAYS GOODBYE.** The last families left the valley on Saturday, the Board said yesterday. The gates at Nant Weir were closed and the water has begun to rise. Mr H. Wendell-Price said it was "a proud day for Wendell".

## 3 September 1979

**LAKE WENDELL FILLING.** Heavy August rain has helped the new reservoir fill weeks ahead of schedule. The Board expects it to reach top water level by Christmas.

## 12 May 1980

**A NEW LAKE FOR THE VALLEY.** Lake Wendell was formally opened on Saturday. In dry spells the chapel roof can be seen.`),
  ];
}

/** The player's own life on the laptop: ordinary, a little worn, and a reminder who is looking. */
export function extraPersonal(c: Ctx): FNode[] {
  const mine = (id: string, name: string, kind: 'txt' | 'doc', parent: string, content: string, when: string): FNode =>
    n(id, name, kind, [parent], { created: when, modified: when, author: c.user, content });
  return [
    mine('todo', 'to do.txt', 'txt', 'mydocs', 'to do\r\n-----\r\n[x] pay phone\r\n[x] call mum back\r\n[ ] rent, Fri (£325!!)\r\n[ ] laundry\r\n[ ] ask Diane about a second week\r\n[ ] library shift, Sat, swap with Jo?\r\n', '12/08/2008 08:40'),
    mine('mum', 'Mum - Sunday.txt', 'txt', 'mydocs', "Mum says Sunday lunch is at one, bring the dish back.\r\nShe wants to know what I actually do all day.\r\n\"Checking old records\" does not seem to satisfy her.\r\n", '10/08/2008 19:22'),
    mine('bus', 'bus times.txt', 'txt', 'mydocs', '42  Halden - Station   0710 0740 0810 0840\r\n17  Station - Estate   every 20 mins\r\nlast 17 home 2305\r\n(the 42 does not run on Sundays)\r\n', '01/08/2008 12:10'),
    mine('cover', 'cover letter - library.doc', 'doc', 'mydocs', `# Cover letter

Dear Ms Griffiths,

I am writing to apply for the full-time post of Library Assistant. For the last two years I have worked on Saturdays at the City Library and I enjoy helping people find what they are looking for.

I am careful, I read old handwriting without complaint, and I like to finish what I start.

Yours sincerely,

*${c.full}*`, '27/07/2008 21:05'),
    n('flat_dep', 'draft - flat deposit.txt', 'txt', ['bin'], { created: '03/03/2008 10:50', modified: '03/03/2008 10:50', author: c.user, binFrom: ['mydocs'], content: 'Dear Mr Parry, about the deposit for the flat. I can pay half now and half on the 1st.\r\n' }),
    n('old_cv', 'CV_old.doc', 'doc', ['bin'], { created: '14/11/2007 18:30', modified: '14/11/2007 18:30', author: c.user, binFrom: ['mydocs'], content: `# ${c.full}\n\nCurriculum Vitae (old)\n\nCity Library, Saturday assistant.\n` }),
    n('unused_pic', 'IMG_0041.jpg', 'img', ['mypics'], { created: '20/07/2008 14:11', modified: '20/07/2008 14:11', art: 'bridge', comments: '' }),
  ];
}

/** Everyday mail, so the inbox is not only about Carrow. */
export function extraMail(c: Ctx): FNode[] {
  const me = meAddr(c);
  return [
    mail('x1', 'inbox', 'Mum <mum@mailbox.co.uk>', me, '12/08/2008 20:14', 'Sunday', `Hi love,\n\nLunch is at one. I'm doing the lamb. Bring the blue dish back, it's been three weeks.\n\nHow is the new job? Is it all computers?\n\nMum x`),
    mail('x2', 'inbox', 'City Library <rota@citylibrary.example>', me, '11/08/2008 16:00', 'Saturday rota', `Hi ${c.user},\n\nCan you cover Jo's shift on the 23rd? She will do your 16th in return.\n\nThanks,\nBev`),
    mail('x3', 'inbox', 'First Bank <statements@firstbank.example>', me, '10/08/2008 06:00', 'Your statement is ready', `Your August statement is ready to view online.\n\nThis is an automatic message. Please do not reply.`),
    mail('x4', 'sent', me, 'Mum <mum@mailbox.co.uk>', '09/08/2008 22:30', 'RE: Sunday', `Yes, one is fine. I will bring the dish.\n\nIt's quite dull really. Old records. I just check that the numbers match.\n\n${c.user}`),
  ];
}
