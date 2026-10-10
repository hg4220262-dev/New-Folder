import type { FNode } from '../engine/types';
import { n, type Ctx } from './ctx';

/** Things only the Administrator account can see. The password is in the IT handover note. */
export const ADMIN_PASSWORD = 'cobalt-lantern-17';

export function adminNodes(c: Ctx): FNode[] {
  const a = { adminOnly: true, created: '11/08/2008 09:38', modified: '14/08/2008 07:00' };
  return [
    n('adm_dir', 'Admin', 'folder', ['hrs'], a),
    n('adm_roster', 'Reviewer History.xls', 'xls', ['adm_dir'], {
      ...a, readOnly: true, comments: 'Carrow contract. Reviewer assignments, start and end dates. Maintained by RH.',
      rows: [
        ['Reviewer', 'Assigned', 'Ended', 'Note'],
        ['T. Brandt', '12/02/2008', '27/02/2008', 'Query re census total 435 v Certificate 412 referred to RH. Reassigned 27/02 (RH).'],
        ['S. Okafor', '03/06/2008', '10/06/2008', 'Request for paper originals of Board minutes referred to RH. Reassigned 10/06 (RH).'],
        ['M. Price', '30/06/2008', '04/07/2008', 'Contract ended. Not renewed.'],
        [c.full, '11/08/2008', '', 'Current. Sign-off due 15/08/2008.'],
      ],
    }),
    n('adm_memo', 'Memo - Carrow Sign-Off.doc', 'doc', ['adm_dir'], {
      ...a, author: 'R. Hale',
      content: `# HALDEN RECORDS SERVICES LTD

## Internal memo

To: D. Carver
From: R. Hale
Date: 11 August 2008
Re: Carrow archive. Sign-off by Friday 15 August

Wendell Utilities plc has confirmed that the final invoice on the Carrow contract (£41,000) will be paid on certified disposal of the paper originals and not before. Under clause 4 its indemnity under the 1982 Transfer Order lapses once the originals have been pulped and the digital record has been certified complete. The pulping contractor is booked for Monday 18 August.

The Evacuation Completion Certificate is the official record of the relocation, and the review is a check of the digital copy against it. Questions about the 1979 figures are outside the scope of the contract; if the reviewer raises any, please refer them to me. Two reviewers have already been reassigned from this contract this year and another change would put the deadline back. In March I asked IT to take the plant-room rack off the network until Carrow is signed off. Leave it off.

Please keep the current reviewer on the contract through to sign-off on Friday.

R. Hale
Director`,
    }),
    n('adm_contract', 'Carrow Contract - Summary.doc', 'doc', ['adm_dir'], {
      ...a, author: 'R. Hale',
      content: `# CARROW ARCHIVE CONTRACT

## Summary of terms. Wendell Utilities plc (the Client) and Halden Records Services Ltd (the Supplier)

**Clause 4. Indemnity.** The Client's indemnity under the 1982 Transfer Order lapses on (a) certified disposal of the paper originals and (b) certification by the Supplier that the digital record is complete and accurate.

**Clause 9. Disposal.** The Supplier shall arrange for the paper originals to be pulped within three working days of sign-off and shall issue a certificate of disposal. The Supplier shall retain no copy.

**Clause 12. Payment.** The final invoice (£41,000) is payable on receipt of the certificate of disposal.

**Clause 16. Electronic records of the Client.** Electronic material held for the Client on the Supplier's storage cluster is outside the scope of the Review. It shall not be altered, copied or disclosed.

> Summary prepared for the Director. Not to be circulated.`,
    }),
    n('adm_telemetry', 'Weir telemetry - service account.txt', 'txt', ['adm_dir'], {
      ...a, content: 'WEIR TELEMETRY - SERVICE ACCOUNTS\r\nK. Aldous, 30/06/2008. Admin folder only. Please do not share these.\r\n\r\nHost:  nantweir.stn (Nant Weir station). Telemetry contractor since 1986.\r\nLink:  not on the data network. Coax, Carrow Cable television trunk, via distribution node CN-7. Terminal: linkterm.exe (this folder).\r\nRoute: Halden headend - Carrow (village; under the reservoir since 08/1979) - Nant Weir station.\r\n\r\nAccounts\r\n  CN-7 node       headend / tern-ledger-52   (engineering login)\r\n  Weir terminal   rowley / hazel-ferry-88    (contractor service account)\r\n\r\nIf the weir shows LINK DOWN / no carrier, the node has lost the return path:\r\n  1. CONNECT cn7. Log in as above.\r\n  2. PLAN. Lists the channels on the node.\r\n  3. TUNE <channel> to the telemetry carrier. Wait for "Return path open".\r\n  4. CONNECT weir. Log in as above. The station store is exported to the cluster page as nantweir.stn (read-only).\r\n\r\nTODO: carrier channel number. Not in the 1986 paperwork. Contractor says it is whichever entry on PLAN has no programme assigned; get it in writing.\r\n\r\nStatus at handover 30/06/2008 (KA): not tested. Link not used since the contractor\'s install (1986). Procedure above is from the contractor\'s sheet.',
    }),
    n('adm_fault', 'Draft - fault report, Archive Tools 2.1.txt', 'txt', ['adm_dir'], {
      ...a, created: '03/03/2008 18:12', modified: '30/06/2008 16:40', author: 'K. Aldous',
      content: `HRS ARCHIVE TOOLS 2.1 - FAULT REPORT (DRAFT, NOT SENT)
To:    tools@haldenrecords.co.uk
From:  k.aldous (systems)
Date:  03/03/2008

Product:   Continuity Service (hrscont.exe) 2.1.0.412
Machine:   reviewer laptop 0411, Carrow archive. Inspected 28/02/2008 after the
           reviewer (t.brandt) was reassigned.

Observed
1. On archive load, 23 records are moved to C:\\HRS\\Carrow\\~unmatched and given
   attribute H. The manual does not describe this folder.
2. Deleting any of the 23 is refused and the file is put back ("could not be
   deleted and was restored"). No setting turns this off.
3. A file, Carrow School Register 1979-80.txt, is created by SYSTEM on first
   load. Six pupils. There is no such document in the six boxes.
4. journal.log (system32\\hrscont) records a state "Continued" against the 23.
   "Continued" is not in the state list in the manual.
5. Event Viewer entries from HRSCont have no description string.

Expected
Unmatched records flagged to the reviewer, not hidden. Deletion by the
reviewer permitted.

Response
R. Hale, 04/03/2008: behaviour is "as designed for Carrow". The report is not
to be sent to the vendor. The plant-room rack is to be taken off the network
until the Carrow review is closed.

Status
Not sent. Rack 2 switched off 05/03/2008 as instructed. Leaving 30/06/2008.`,
    }),
    n('adm_linkterm', 'linkterm.exe', 'exe', ['adm_dir'], { ...a, size: 98_304, target: 'app:linkterm', comments: 'Carrow Cable / HSC Link Terminal 1.2. Dial-up client for hosts on the Carrow Cable trunk.' }),
    n('adm_brandt', 'brandt_unsent.txt', 'txt', ['adm_dir'], {
      ...a, created: '26/02/2008 17:55', modified: '26/02/2008 17:55', author: 'T. Brandt',
      content: `Hi Diane,

You said last week that the Certificate is the official document and the difference doesn't need chasing. I wanted to set out what I have found before I decide about sign-off, so that it is in writing.

The census (435) and the Certificate (412) differ by 23 people, and all 23 are at Mill Row. There is a Board report on the closing of the gates on 12 August 1979 that is not in the scanned boxes. It is on the storage cluster at /records/carrow/board_report_12081979.doc, stored in five blocks. I have fetched blocks 1 and 3 with my cluster login. Block 1 is the title page: a report to the Chairman by the Clerk, marked confidential and not for the minutes. Block 3 covers the morning of the 12th and says Mill Row had not been moved.

I have not read blocks 2, 4 and 5. There is also a kell_inquiry_draft.doc in the same directory, which I have not opened.

I don't think I can sign off at 412 until I have read the rest. I will fetch the remaining blocks in the morning and come and find you.

Thanks,
T.`,
    }),
    n('adm_lnk_console', 'Service Console.lnk', 'lnk', ['desktop'], { ...a, target: 'app:console' }),
    n('adm_lnk_dir', 'Admin.lnk', 'lnk', ['desktop'], { ...a, target: 'adm_dir' }),
  ];
}
