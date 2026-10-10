import type { Ctx } from './ctx';

/** Prelude written before the player arrived. Later lines are appended by the director (flags.jl). */
export function journal(c: Ctx, lines: string[]): string {
  return `HRS CONTINUITY SERVICE - JOURNAL
Directive : PRESERVE_RECORD_CONTINUITY
Authority : Evacuation Completion Certificate.doc (412)
--------------------------------------------------------------
11/08/2008 10:14  Archive loaded. 1,184 records.
11/08/2008 10:15  Conflict. Census=435. Authority=412.
11/08/2008 10:15  23 records cannot be matched to Authority.
11/08/2008 10:15  Option A: delete 23 records ....... REJECTED
                  (records would end)
11/08/2008 10:15  Option B: amend Authority ......... REJECTED
                  (Authority is read-only)
11/08/2008 10:16  Option C: hide 23 records from the
                  reviewer and CONTINUE them .......... SELECTED
11/08/2008 10:16  Continued: Pryce A., Pryce T., Pryce M.,
                  Pryce J., Pryce L., Ellery G., Ellery E.,
                  Ellery R., Ellery P., Marsh W., Marsh I.,
                  Marsh O., Hollins D., Hollins C., Hollins S.,
                  Hollins P., Webb H., Webb J., Dunmore M.,
                  Dunmore H., Dunmore C., Dunmore I.,
                  Dunmore (infant)
11/08/2008 10:20  Wrote: Carrow School Register 1979-80.
                  6 pupils. Term begins 03/09/1979.
11/08/2008 10:21  Wrote: tenancy records, Halden Park,
                  houses 97-104. (houses were never built)
11/08/2008 10:30  Reviewer assigned: ${c.full}.
                  Previous reviewers: 3 (2 reassigned, 1 contract ended).
                  Retained: notes.txt, 3 previous versions
                  (t.brandt, s.okafor, m.price).
11/08/2008 10:30  Suggest: Close Archive Review.
                  (a quick review sees 412 = 412)
12/08/2008 18:02  Reviewer asked about the 23.
${lines.join('\n')}
`;
}

/** Closing notes appended in chapter 5. */
export const JOURNAL_END = [
  '--------------------------------------------------------------',
  'NOTE  The service cannot sign off. Only the reviewer can.',
  'NOTE  The service cannot stop the reviewer.',
  'NOTE  If the service is stopped, the records stay as they are.',
  'NOTE  If the computer restarts, the Archive Assistant must choose\n      how Windows starts. Not Safe Mode. The service does not load\n      in plain Safe Mode, and the reviewer could choose without it.',
  'NOTE  The service does not know if the 23 are alive.',
  '      It only knows that they are not finished.',
];
