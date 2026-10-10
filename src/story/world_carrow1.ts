import type { FNode } from '../engine/types';
import { n, scan } from './ctx';

export function carrowAdmin(): FNode[] {
  return [
    n('hrs', 'HRS', 'folder', ['c'], { created: '11/08/2008 09:38', modified: '14/08/2008 09:12' }),
    n('carrow', 'Carrow', 'folder', ['hrs'], { created: '11/08/2008 10:02', modified: '14/08/2008 09:12' }),
    n('f_admin', '01 Administration', 'folder', ['carrow'], scan),
    n('f_census', '02 Census', 'folder', ['carrow'], scan),
    n('f_reloc', '03 Relocation', 'folder', ['carrow'], scan),
    n('f_photos', '04 Photographs', 'folder', ['carrow'], scan),
    n('f_eng', '05 Engineering', 'folder', ['carrow'], scan),
    n('f_corr', '06 Correspondence', 'folder', ['carrow'], scan),
    n('scheme', 'Carrow Reservoir Scheme - Summary.doc', 'doc', ['f_admin'], {
      ...scan, comments: 'Box 1 / Item 1',
      content: `# WENDELL WATER BOARD

## The Carrow Reservoir Scheme: Summary for the Public

The Board is building a dam across the Carrow valley at Nant Weir. This will provide drinking water for Halden and the towns of the lower Wendell for the next hundred years.

The reservoir, to be called **Lake Wendell**, will cover the village of Carrow and the lower valley to a depth of up to 30 metres.

Every household in Carrow will be offered a new home, either on the Board's new estate at Halden Park or with help towards an arrangement of the family's own choosing. Removal costs will be met in full.

The removal of residents will be completed before the dam gates are closed. **No closure of the gates will take place until the Board's engineer has certified that the valley is clear.**

Timetable
- Spring 1978: census of residents
- 1978-79: building of Halden Park
- August 1979: removal of residents, street by street
- 13 August 1979: closure of the gates

> Wendell Water Board, Halden. February 1978.`,
    }),
    n('cert', 'Evacuation Completion Certificate.doc', 'doc', ['f_admin'], {
      ...scan, comments: 'Box 1 / Item 9',
      content: `# CERTIFICATE OF COMPLETION

## Carrow Reservoir Scheme: removal of residents

I certify that the removal of all residents of the village of Carrow and the lower Carrow valley has been completed, and that the valley is clear for the closure of the gates at Nant Weir.

Residents recorded in the Board's census: **412**
Residents rehoused: **412**

Signed: *H. Wendell-Price*, Chairman (for the Board's engineer)
Date: 12 August 1979, 09:00

> Note: the engineer, Mr R. Kell, was unavailable to sign.`,
    }),
    n('minutes', 'Board Minutes March 1979.doc', 'doc', ['f_admin'], {
      ...scan, comments: 'Box 1 / Item 6',
      content: `# WENDELL WATER BOARD

## Minutes of the meeting of 14 March 1979 (extract)

Present: H. Wendell-Price (Chair), R. Kell (Engineer), J. Amory (Housing), four members.

**4. Halden Park.** Mr Amory reported that 96 of 104 houses will be ready by August. The remaining eight are delayed by the winter.

**5. Mill Row.** Mr Amory reported that the six households of Mill Row cannot be offered houses until the remaining eight are finished. He proposed that Mill Row be moved last, on 13 August, the day of closure.

Mr Kell asked that it be minuted that Mill Row is the lowest part of the village and would be the first to flood. He advised against any closure before Mill Row is clear.

**6. Rainfall.** The Chair noted that the contractors would be paid a bonus for early completion if the reservoir began filling before the autumn.

The Chair thanked members. Meeting closed 21:10.`,
    }),
  ];
}

export function carrowRelocation(): FNode[] {
  return [
    n('summary', 'Relocation Summary.doc', 'doc', ['f_reloc'], {
      ...scan, comments: 'Box 3 / Item 2',
      content: SUMMARY_ORIG,
    }),
  ];
}

const SUMMARY_ORIG = `# RELOCATION SUMMARY

## Carrow Reservoir Scheme. Housing Department, August 1979

Residents recorded in the census of spring 1978: **435**

Residents rehoused by 12 August 1979: **412**

The remaining 23 residents live at Mill Row (six households). They will be moved on 13 August when the last houses at Halden Park are finished. See the engineer's note **MR-1** in Correspondence.

> J. Amory, Housing. 10 August 1979.`;

export const SUMMARY_HARMONISED = `# RELOCATION SUMMARY

## Carrow Reservoir Scheme. Housing Department, August 1979

Residents recorded in the census of spring 1978: **412**

Residents rehoused by 12 August 1979: **412**

All residents have been rehoused. The removal of residents is complete.

> J. Amory, Housing. 10 August 1979.`;
