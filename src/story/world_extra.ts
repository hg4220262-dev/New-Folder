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
    return [`${String(d).padStart(2, '0')}/08/1979`, String(mm), d === 12 ? 'Heavy from 08:00' : d === 13 ? 'Continuous' : ''];
  });
  return [
    // ---- 01 Administration
    doc('press', 'Press Release Feb 1978.doc', 'f_admin', 'Box 1 / Item 3', `# WENDELL WATER BOARD

## Press notice. For publication on or after 9 February 1978

**Carrow Reservoir Scheme**

1. The Board announces that construction of the dam at Nant Weir will begin in April 1978. The contractor is Kestrel Civil Engineering Ltd of Halden. The reservoir, to be named Lake Wendell, will supply Halden and the towns of the lower Wendell.

2. A census of the residents of Carrow and the lower valley will be taken by Board officers during the spring. Householders are asked to give the enumerator the names and ages of all persons living at the address.

3. The Board is building 104 houses at Halden Park, each with electricity, a bathroom and a garden. Every household in the valley will be offered one of these houses or a grant towards an arrangement of its own choosing. Removal will be carried out street by street during August 1979. The gates at Nant Weir will be closed on 13 August 1979, after the Board's engineer has certified that the valley is clear.

4. The Chairman, Mr H. Wendell-Price, said: "Carrow will be remembered. No family will be asked to leave until its new house is ready for it."

> Enquiries: B. Lloyd, Information Officer, Wendell Water Board, Halden 2200.`),
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
      ['R. Kell', 'Engineer', '22', 'On site most days. Messages via Nant Weir call box.'],
      ['M. Hughes', 'Clerk to the Board', '3', ''],
      ['E. Rowley', 'Weir keeper, Nant Weir', '(call box)', 'Halden exchange. Ask for Nant Weir.'],
      ['B. Lloyd', 'Information Officer', '9', ''],
    ]),
    // ---- 02 Census
    text('enum', 'Enumerator Notes.txt', 'f_census', 'Box 2 / Item 3',
      "CENSUS OF RESIDENTS 1978. ENUMERATOR'S NOTES (extracts)\r\nEnumerator: J. Amory (Housing). Forms collected 24 April to 6 May 1978.\r\n\r\nHigh Street: 34 houses. Two empty (Nos. 9 and 22). Forms complete.\r\nChurch Lane: No. 7 (Mr Bevan) would not open the door. Entered from\r\n  the neighbours, two persons.\r\nChapel Row: forms complete. Rev. Parry assisted.\r\nBack Lane and School Lane: forms complete.\r\nMill Row: six houses, all occupied. Lane unmade, no street light.\r\n  Floods from the river in a wet winter, residents say (1947, 1960).\r\n  No. 6, Mrs Dunmore: baby expected in the autumn. Add by hand\r\n  when notified.\r\nStation Road: two farms returned late. Forms complete 6 May.\r\nWendell Road and outlying farms: forms by post.\r\n\r\nTotal persons entered for the Board: see summary sheet.\r\n"),
    sheet('chapel', 'Chapel Roll 1978.xls', 'f_census', 'Box 2 / Item 5', [
      ['Name', 'Pew', 'Joined', 'Notes'],
      ['Mrs E. Ellery', '12', '1931', 'Organist'],
      ['Mr W. Marsh', '14', '1939', 'Deacon'],
      ['Mr H. Webb', '15', '1946', ''],
      ['Mrs A. Pryce', '9', '1960', 'Sunday school'],
      ['Mr & Mrs M. Dunmore', '11', '1971', 'Married at Bethel, June 1971'],
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
      ['11/08/1979', 'High Street (south)', '16', '3', 'Main removal complete.'],
      ['13/08/1979', 'Mill Row', '6', '1', 'Nos. 97-102 Halden Park to be handed over by the builder 11/08. 1 lorry, 2 men (Evans) booked.'],
    ]),
    sheet('tenancy', 'Halden Park Tenancies.xls', 'f_reloc', 'Box 3 / Item 6', [
      ['House', 'Tenant', 'Moved in', 'Rent (wk)'],
      ['95', 'Probert, G. & family', '09/08/1979', '£4.10'],
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
    doc('invoice', 'Removal Contractor Invoice.doc', 'f_reloc', 'Box 3 / Item 8', `# EVANS & SONS, HAULIERS AND REMOVERS

## Station Yard, Halden. Invoice No. 1187. 14 August 1979

To: Wendell Water Board, Halden. Your order of 16 July 1979 (Housing Department).

Carrow Reservoir Scheme. Removal of household effects, Carrow to Halden Park and other addresses, 2 to 11 August 1979, as the Board's schedule.

- Removals, 80 households, 17 lorry days with driver and mate: £3,440.00
- Packing cases and tea chests, hire and collection: £312.00
- Effects held overnight at Station Yard, 3 households: £166.00

**Total due £3,918.00**

13 August, Mill Row, 1 lorry and 2 men, held under the above order. Cancelled by telephone from the Board office, 12 August. No charge.

> Terms 30 days. Cheques payable to Evans & Sons.`),
    // ---- 04 Photographs
    photo('p_fete', 'Carrow Fete 1977.jpg', 'fete', 'Carrow summer fete on the green, July 1977.', '11/08/2008 11:06'),
    photo('p_bridge', 'The old bridge.jpg', 'bridge', 'The old bridge over the Nant, 1978.', '11/08/2008 11:06'),
    photo('p_weir', "Weir keeper's cottage.jpg", 'weir', "Nant Weir, summer 1979. The keeper's cottage and the sluice gates, with the station on the crest of the dam. A kingfisher is painted on the station door.", '11/08/2008 11:07'),
    photo('p_farm', 'Top Farm.jpg', 'farm', 'Top Farm, Station Road, summer 1977.', '11/08/2008 11:07'),
    photo('p_chapin', 'Bethel Chapel interior.jpg', 'chapin', 'Interior of Bethel Chapel, looking towards the pulpit, 1978.', '11/08/2008 11:08'),
    // ---- 05 Engineering
    sheet('rain', 'Rainfall Records 1979.xls', 'f_eng', 'Box 5 / Item 2', [['Date', 'Rainfall (mm)', 'Notes'], ...aug]),
    doc('weirops', 'Weir Operating Instructions.doc', 'f_eng', 'Box 5 / Item 4', `# NANT WEIR. STANDING INSTRUCTIONS TO THE KEEPER

## Issued by the Engineer. Revised June 1979

1. The keeper is responsible for the sluice gates, the stilling well and gauge board, the station on the crest of the dam, and the cottage and grounds.

2. Levels are to be read from the gauge board and entered in the gate log in metres above Board datum: hourly while the gates are being worked, and at 09:00 and 18:00 at other times. Rainfall is to be read at 09:00 and entered on the monthly sheet.

3. The gates are to be raised or lowered only on the instruction of the Board. Instructions will be given by the Engineer, in writing. An instruction received by telephone is to be entered in the log with the time and the name of the officer giving it, and is to be confirmed in writing.

4. The gates will not be closed for impounding until the Engineer has certified under clause 15 of the contract that the valley below top water level (150.0 m) is clear of residents, and a copy of the certificate has been received at the station.

5. In an emergency the keeper is to telephone the Engineer at the Board office (Halden 2200, extension 22) from the call box. If the Engineer cannot be reached, the gates are to be left as they stand and the call repeated at intervals until he is reached.

6. The station is to be kept locked. Keys are held by the keeper and the Engineer. The panel is not to be worked by any other person.

7. Visitors to the dam are to sign the book kept in the cottage.

> R. Kell, Engineer. June 1979.`),
    text('kellnotes', 'Valley Survey Notes.txt', 'f_eng', 'Box 5 / Item 6',
      'R. KELL, ENGINEER. FIELD BOOK No. 4, CARROW VALLEY. LEVELS\r\n(copied from the field book for the office file, 3/79)\r\n\r\nLevels in metres above Board datum. Watts level and staff.\r\nClosed from BM on old bridge, road at crown (139.8) and back, error 4 mm.\r\n\r\nNant Weir, gate sill ................. 118.0\r\nOld bridge, road at crown ............ 139.8\r\nMill Row, lane at No. 1 door ......... 141.2  lowest dwellings\r\nMill Row, lane at No. 6 .............. 141.4\r\nChapel Row, road ..................... 143.6\r\nBethel Chapel, floor ................. 144.1\r\nHigh Street at the post office ....... 146.0\r\nSchool, yard ......................... 147.5\r\nStation Road, at the junction ........ 149.0\r\nTop water level (design) ............. 150.0\r\n\r\nFlood marks, Mill Row. 1947: mark on the wash-house wall at No. 3\r\n  (Mr Marsh), 141.8. 1960: no mark, over the step at No. 1, say\r\n  141.5.\r\n\r\nFilling. With the gates shut in wet weather the first 20 m above\r\n  the sill would come up in a few hours, the valley being narrow\r\n  there. Mill Row (141.2) say five to eight hours after closure in\r\n  heavy rain, Chapel Row (143.6) some hours after that.\r\n\r\n14/3/79. Board meeting. Mill Row item minuted. R.K.\r\n'),
    // ---- 06 Correspondence
    doc('pryce', 'Letter from Mrs Pryce.doc', 'f_corr', 'Box 6 / Item 5', `# 1 Mill Row, Carrow

## 28 July 1979

Dear Mr Amory,

I am writing about the day of our removal. Your officer who called in June told Mr Pryce it would be Monday 13 August, and Mrs Ellery at No. 2 was told the same, but Mrs Webb was told at the Board office in Halden on Thursday that the last lorries go on the 11th. We should be glad to know which is right, as the children's school things must be packed and the beds taken down the night before, and Mr Pryce has to ask for the day off at the works.

We have not had the key for the new house yet, or been told the number, and the rent man has not said whether we pay here for that week or at Halden Park.

Yours sincerely,

*Ann Pryce (Mrs)*`),
    doc('amory', 'Reply to Mrs Pryce.doc', 'f_corr', 'Box 6 / Item 6', `# WENDELL WATER BOARD

## Housing Department, Halden. 2 August 1979

Our ref. H/Rem/17

Dear Mrs Pryce,

Thank you for your letter of 28 July.

Mill Row will be moved on Monday 13 August 1979, the last day of the removal. The lorry and two men will call at eight o'clock in the morning. Please have everything packed by then.

Your new house is No. 97 Halden Park. The keys will be handed to you by the Board's foreman on arrival. The rent is £4.10 a week and is payable from Monday 20 August; the rent for Mill Row ceases on 12 August. Please bring your rent book with you.

Yours sincerely,

*J. Amory*, Housing Officer`),
    doc('kestrel', 'Kestrel Letter Aug 1979.doc', 'f_corr', 'Box 6 / Item 9', `# KESTREL CIVIL ENGINEERING LTD

## Contracts Office, Halden. 7 August 1979

Our ref. C/312/PG. Your ref. WWB/Carrow.

The Chairman, Wendell Water Board, Halden.

Dear Mr Wendell-Price,

**Carrow Reservoir Scheme. Contract No. 312. Impounding.**

1. We confirm that the gates at Nant Weir, the stop-log sets and the drawdown culvert were proved on 4 August and that the works are ready for impounding. Plant and the full gang will remain on site until closure.

2. Under clause 14 the completion bonus of £180,000 is payable if impounding begins on or before 12 August 1979. Under clause 15 impounding requires the certificate of the Board's engineer that the valley is clear of residents. We have not yet received a copy of the certificate.

3. The long-range forecast is for rain from the 11th. We should be grateful for the Board's written confirmation of the date and hour of closure by return, so that the gang can be stood down after it. Standing time from 13 August will be charged at the Schedule 3 daywork rates.

Yours sincerely,

*P. Garrow*, Contracts Manager`),
    doc('cuttings', 'Press Cuttings 1979.doc', 'f_corr', 'Box 6 / Item 11', `# HALDEN COURIER. CUTTINGS

## Tuesday 14 August 1979

**CARROW SAYS GOODBYE.** The last families left the valley on Saturday, the Board said yesterday.

The gates at Nant Weir were closed at nine o'clock on Sunday morning and the Nant has begun to fill the valley above the dam. The Board said that the removal of the 412 residents on its relocation list had been completed and certified, and that the last of its tenants had moved into Halden Park on Saturday.

Mr H. Wendell-Price, Chairman of the Wendell Water Board, said it was "a proud day for Wendell". He thanked the people of Carrow and the removal contractors, Evans & Sons of Halden.

Children from Carrow start at Halden Junior School on 3 September.

## Monday 3 September 1979

**LAKE WENDELL FILLING.** The new reservoir at Carrow passed 148 metres at the dam on Friday, the Board said, against a top water level of 150 metres. Heavy rain on 12 and 13 August brought the level up faster than had been expected.

The road over the old bridge has been closed since 12 August. Traffic for the upper valley is to use the Wendell road.

The Board expects the reservoir to reach top water level by Christmas and to supply Halden from the new works at Nant Weir from next summer.

## Monday 12 May 1980

**A NEW LAKE FOR THE VALLEY.** Lake Wendell was formally opened on Saturday by the Chairman of the Wendell Water Board, Mr H. Wendell-Price, in the presence of members of the Board and of Kestrel Civil Engineering Ltd, the contractors.

The dam at Nant Weir is 32 metres high. The reservoir will supply Halden and the towns of the lower Wendell.

The roof of Bethel Chapel can be seen from the Wendell road when the level is low.`),
  ];
}

/** The player's own life on the laptop: ordinary, a little worn, and a reminder who is looking. */
export function extraPersonal(c: Ctx): FNode[] {
  const mine = (id: string, name: string, kind: 'txt' | 'doc', parent: string, content: string, when: string): FNode =>
    n(id, name, kind, [parent], { created: when, modified: when, author: c.user, content });
  return [
    mine('todo', 'to do.txt', 'txt', 'mydocs', 'to do\r\n-----\r\n[x] pay phone\r\n[x] call mum back\r\n[ ] rent, Fri (£325!!)\r\n[ ] laundry\r\n[ ] ask Diane about a second week\r\n[ ] library shift, Sat, swap with Jo?\r\n', '12/08/2008 08:40'),
    mine('mum', 'Mum - Sunday.txt', 'txt', 'mydocs', "sun 10th - mum's\r\n\r\nforgot the blue dish again. next sun 1pm, lamb.\r\nshe asked what the job is. said checking scanned records for a water co.\r\ndad says ask if they pay weekly.\r\nring Jo re sat 16th\r\n", '10/08/2008 19:22'),
    mine('bus', 'bus times.txt', 'txt', 'mydocs', '42  Halden - Station   0710 0740 0810 0840\r\n17  Station - Estate   every 20 mins\r\nlast 17 home 2305\r\n(the 42 does not run on Sundays)\r\n', '01/08/2008 12:10'),
    mine('cover', 'cover letter - library.doc', 'doc', 'mydocs', `# Cover letter - City Library

27 July 2008

Dear Ms Griffiths,

I am writing to apply for the full-time post of Library Assistant advertised in the Courier on 24 July.

I have worked Saturdays at the City Library since 2006, on the issue desk and on shelving and reservations, and I know the branch and its regulars. I am used to the issue system and to Microsoft Office. From 11 August I have a temporary contract with Halden Records Services, checking scanned records, and I would be free to start at the end of August.

I am available for interview on any weekday after 5.30 or on a Saturday. My CV is attached.

Yours sincerely,

*${c.full}*`, '27/07/2008 21:05'),
    n('flat_dep', 'draft - flat deposit.txt', 'txt', ['bin'], { created: '03/03/2008 10:50', modified: '03/03/2008 10:50', author: c.user, binFrom: ['mydocs'], content: 'Dear Mr Hayward, about the deposit for the flat. I can pay half now and half on the 1st.\r\n' }),
    n('old_cv', 'CV_old.doc', 'doc', ['bin'], { created: '14/11/2007 18:30', modified: '14/11/2007 18:30', author: c.user, binFrom: ['mydocs'], content: `# ${c.full}\n\nCurriculum Vitae (old)\n\nCity Library, Saturday assistant.\n` }),
    n('unused_pic', 'IMG_0041.jpg', 'img', ['mypics'], { created: '20/07/2008 14:11', modified: '20/07/2008 14:11', art: 'bridge', comments: '' }),
  ];
}

/** Everyday mail, so the inbox is not only about Carrow. */
export function extraMail(c: Ctx): FNode[] {
  const me = meAddr(c);
  return [
    mail('x1', 'inbox', 'Mum <mum@mailbox.co.uk>', me, '12/08/2008 20:14', 'Next Sunday', `Hi love,\n\nLunch is at one on Sunday. I'm doing the lamb. Bring the blue dish back, it's been three weeks.\n\nHow is the new job? Is it all computers?\n\nMum x`),
    mail('x2', 'inbox', 'City Library <rota@citylibrary.example>', me, '11/08/2008 16:00', 'Saturday rota', `Hi ${c.user},\n\nCan you cover Jo's shift on the 23rd? She will do your 16th in return.\n\nThanks,\nBev`),
    mail('x3', 'inbox', 'First Bank <statements@firstbank.example>', me, '10/08/2008 06:00', 'Your statement is ready', `Your August statement is ready to view online.\n\nThis is an automatic message. Please do not reply.`),
    mail('x4', 'sent', me, 'Mum <mum@mailbox.co.uk>', '09/08/2008 22:30', 'RE: Sunday', `Yes, one is fine. I will bring the dish.\n\nI start Monday. It is a week of checking old records for a water company. Diane says the software does most of it and I just make sure the numbers agree.\n\n${c.user}`),
  ];
}
