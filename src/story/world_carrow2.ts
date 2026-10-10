import type { FNode } from '../engine/types';
import { n, scan } from './ctx';
import { censusRows, relocationRows } from './people';

const ph =(id: string, name: string, art: string, comments: string, taken: string) =>
  n(id, name, 'img', ['f_photos'], { ...scan, art, comments, created: '11/08/2008 11:02', modified: taken });

export function carrowRecords(): FNode[] {
  return [
    n('census', 'Census of Residents 1978.xls', 'xls', ['f_census'], {
      ...scan, comments: 'Box 2 / Item 1. Typed census, spring 1978.', rows: censusRows(),
    }),
    n('census_note', 'About the census.txt', 'txt', ['f_census'], {
      ...scan, readOnly: false,
      content: 'Scanned from Box 2. Typed census of residents taken by the Board in\r\nspring 1978. One row per resident. Babies born after spring 1978 were\r\nadded by hand at the bottom of each page.\r\n\r\n- HRS Scanning, 11/08/2008\r\n',
    }),
    n('reloc', 'Relocation List 1979.xls', 'xls', ['f_reloc'], {
      ...scan, comments: 'Box 3 / Item 1. Rehousing register, August 1979.', rows: relocationRows(),
    }),

    ph('p_high', 'High Street 1977.jpg', 'street', 'High Street looking towards the chapel, summer 1977.', '11/08/2008 11:02'),
    ph('p_chapel', 'Chapel from the bridge.jpg', 'chapel', 'Bethel Chapel and the old bridge, 1978.', '11/08/2008 11:03'),
    ph('p_school', 'Carrow School 1978.jpg', 'school', 'Carrow School, whole school photograph, July 1978. 41 pupils.', '11/08/2008 11:03'),
    ph('p_works', 'Nant Weir works 1978.jpg', 'dam', 'Building the dam at Nant Weir, autumn 1978.', '11/08/2008 11:04'),
    ph('p_halden', 'Halden Park new houses.jpg', 'estate', 'The Board\'s new estate at Halden Park, July 1979.', '11/08/2008 11:04'),
    ph('p_lake', 'Lake Wendell 1980.jpg', 'lake', 'Lake Wendell, spring 1980. The chapel roof is visible when the water is low.', '11/08/2008 11:05'),
    // The Mill Row photograph starts visible. It is "tidied" once the player has opened it (or, from chapter 2, looked in Photographs) and then looks away.
    n('scan412_vis', 'Mill Row 12-08-1979.jpg', 'img', ['f_photos'], { ...scan, created: '11/08/2008 11:05', modified: '12/08/1979 15:10', art: 'millrow_far', comments: 'Mill Row from the old bridge, 12 August 1979, 3.10 pm.' }),

    n('plan', 'Valley Plan 1978.jpg', 'img', ['f_eng'], {
      ...scan, art: 'map', comments: 'Plan of the valley with ground levels in metres. Gate sill 118.0 m. Top water level 150.0 m.',
    }),
    n('gatelog', 'Nant Weir Gate Log Aug 1979.log', 'log', ['f_eng'], { ...scan, content: GATE_LOG }),
    n('levels', 'Ground Levels.txt', 'txt', ['f_eng'], {
      ...scan,
      content: 'CARROW VALLEY. GROUND LEVELS (metres above datum)\r\n\r\nNant Weir gate sill ......... 118.0\r\nOld bridge .................. 139.8\r\n'
        + 'Mill Row .................... 141.2   <- lowest dwellings\r\nChapel Row .................. 143.6\r\nBethel Chapel ............... 144.1\r\n'
        + 'High Street .................. 146.0\r\nCarrow School ............... 147.5\r\nStation Road ................ 149.0\r\n\r\nTop water level ............. 150.0\r\n',
    }),

    n('letter_res', 'Letter to Residents June 1979.doc', 'doc', ['f_corr'], {
      ...scan, content: `# WENDELL WATER BOARD

Dear Resident,

Your household will be moved to its new home during August 1979. A Board officer will call to agree the day. Lorries and men will be provided.

Please do not remain in the valley after your removal day. The gates at Nant Weir will be closed on **13 August 1979**, and the water will rise quickly in the lower village.

Yours faithfully,

*J. Amory*, Housing Officer`,
    }),
    n('letter_contr', 'Contractor Bonus Agreement.doc', 'doc', ['f_corr'], {
      ...scan, content: `# AGREEMENT (extract)

Between the Wendell Water Board and Kestrel Civil Engineering Ltd.

**Clause 14.** A completion bonus of £180,000 is payable if impounding (closure of the gates) begins on or before **12 August 1979**, so that the reservoir can make use of the August rainfall.

**Clause 15.** No impounding may begin until the Board's engineer has certified that the valley is clear of residents.`,
    }),
  ];
}

const GATE_LOG = `NANT WEIR - GATE AND LEVEL LOG
Keeper: E. Rowley.  Levels in metres above datum.
------------------------------------------------------
11/08/1979 18:00  Gates open. Level 118.4. Dry weather.
12/08/1979 08:40  Instruction received by telephone (H.W-P.)
                  to close the gates at 09:00.
12/08/1979 09:00  GATES CLOSED.  Level 118.6
12/08/1979 10:00  Level 124.9   Heavy rain on the hills.
12/08/1979 11:00  Level 130.3
12/08/1979 12:00  Level 134.6   Old bridge road shut.
12/08/1979 13:00  Level 137.8
12/08/1979 14:00  Level 140.1
12/08/1979 15:00  Level 141.5
12/08/1979 16:00  Level 142.6   Mr Kell came to the weir and
                  asked for the gates to be opened. Told
                  I had no instruction to do so.
12/08/1979 17:00  Level 143.4
12/08/1979 18:00  Level 144.0   Chapel Row under water.
13/08/1979 09:00  Level 146.3
------------------------------------------------------
`;
