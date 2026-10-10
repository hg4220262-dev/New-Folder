import type { FNode } from '../engine/types';
import { n, type Ctx } from './ctx';

/** Things only the Administrator account can see. The password is in the IT handover note. */
export const ADMIN_PASSWORD = 'cobalt-lantern-17';

export function adminNodes(c: Ctx): FNode[] {
  const a = { adminOnly: true, created: '11/08/2008 09:38', modified: '14/08/2008 07:00' };
  return [
    n('adm_dir', 'Admin', 'folder', ['hrs'], a),
    n('adm_roster', 'Reviewer History.xls', 'xls', ['adm_dir'], {
      ...a, readOnly: true, comments: 'HRS reviewer assignments, Carrow.',
      rows: [
        ['Reviewer', 'Assigned', 'Ended', 'Note'],
        ['T. Brandt', '12/02/2008', '27/02/2008', 'Reassigned. Asked about the 23.'],
        ['S. Okafor', '03/06/2008', '10/06/2008', 'Reassigned. Requested the Board minutes.'],
        ['M. Price', '30/06/2008', '04/07/2008', 'Contract ended. No forwarding address.'],
        [c.full, '11/08/2008', '', 'Active. Review due 15/08/2008.'],
      ],
    }),
    n('adm_memo', 'Memo - Carrow Sign-Off.doc', 'doc', ['adm_dir'], {
      ...a, author: 'R. Hale',
      content: `# HALDEN RECORDS SERVICES LTD

## Internal memo. Carrow: sign-off by 15 August

Wendell Utilities plc, the Board's successor, has made the Carrow contract conditional on the destruction of the paper originals. Its indemnity under the 1982 Transfer Order lapses once the originals are pulped and the digital record is certified. It will not pay the final invoice (£41,000) until then.

Please make sure the temp signs off at 412. Do not encourage questions. The last two reviewers were reassigned.

> R. Hale, Director.`,
    }),
    n('adm_contract', 'Carrow Contract - Summary.doc', 'doc', ['adm_dir'], {
      ...a, author: 'R. Hale',
      content: `# CARROW ARCHIVE CONTRACT

## Halden Records Services Ltd. and Wendell Utilities plc. Summary

**Clause 4. Indemnity.** Wendell Utilities' indemnity under the 1982 Transfer Order lapses when the paper originals are destroyed and the digital record is certified complete and accurate.

**Clause 9. Destruction.** The originals are to be pulped within three working days of sign-off. The Supplier will not keep copies.

**Clause 12. Payment.** The final invoice of £41,000 is payable on certified destruction.

**Clause 15. Records held elsewhere.** Material held on the Supplier's storage cluster is outside the scope of this review and is to be left undisturbed.

> Summary prepared for the Director. Not for reviewers.`,
    }),
    n('adm_telemetry', 'Weir telemetry - service account.txt', 'txt', ['adm_dir'], {
      ...a, content: 'WEIR TELEMETRY (contractor, 1986-)\r\n\r\nThe weir station is on the cluster network as nantweir.stn. Its link to the cluster does not run on the data network. It rides the old Carrow Cable television trunk, and has done since 1986.\r\n\r\nCable distribution node CN-7. Dial it from linkterm.exe in this folder (CONNECT cn7):  headend / tern-ledger-52\r\nService account for the weir terminal:  rowley / hazel-ferry-88\r\n\r\nIf the weir reports no carrier, the node has been retuned. The telemetry was put on a channel the plan never gave to a programme; tune the node back to it, then CONNECT weir.\r\n\r\nThe sluice panel needs the station code in two halves. One half is in the keeper\'s notes, the other is in the manual. Nobody has needed either since 1986.',
    }),
    n('adm_linkterm', 'linkterm.exe', 'exe', ['adm_dir'], { ...a, size: 98_304, target: 'app:linkterm', comments: 'Carrow Cable link terminal. Dials hosts on the old trunk.' }),
    n('adm_brandt', 'brandt_unsent.txt', 'txt', ['adm_dir'], {
      ...a, created: '26/02/2008 17:55', modified: '26/02/2008 17:55', author: 'T. Brandt',
      content: `Diane,

I have found where the Board's papers went. They are not on the laptop. They are on the storage cluster, in pieces, on three racks.

I can reach two of the racks. The third has no heartbeat. I think the switch has to be restarted from the administrator console, and I do not have the password.

Part of the engineer's statement is only on that third rack. I want to read it before I decide whether to sign.

I will try again tomorrow.

T.`,
    }),
    n('adm_lnk_console', 'Service Console.lnk', 'lnk', ['desktop'], { ...a, target: 'app:console' }),
    n('adm_lnk_dir', 'Admin.lnk', 'lnk', ['desktop'], { ...a, target: 'adm_dir' }),
  ];
}
