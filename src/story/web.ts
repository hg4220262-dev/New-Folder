// The static pages Internet Explorer can open. Edit this list to allow more.
// Anything else shows "page cannot be displayed", except the storage cluster (HSC_HOST in storage.ts), which Ie.tsx hands to Hsc.tsx.
export interface Page { title: string; lines: string[]; links?: [string, string][] }

export const HOME = 'http://www.haldenrecords.co.uk/';

const PAGES: Record<string, Page> = {
  'www.haldenrecords.co.uk': {
    title: 'Halden Records Services Ltd.',
    lines: ['Halden Records Services Ltd.', 'Digitising the past, safely.', '', 'We scan, index and certify archives for councils and public bodies across the Wendell valley.'],
    links: [['Staff intranet', 'http://intranet.haldenrecords.co.uk/'], ['About the Carrow project', 'http://www.haldenrecords.co.uk/carrow']],
  },
  'www.haldenrecords.co.uk/carrow': {
    title: 'The Carrow Archive - Halden Records',
    lines: ['The Carrow Archive', 'Wendell Water Board records, 1977-1980. 6 boxes, 1,184 scanned items.', '', 'Review status: counts agree (412 / 412). Sign-off due Friday 15 August 2008.'],
    links: [['Home', 'http://www.haldenrecords.co.uk/']],
  },
  'intranet.haldenrecords.co.uk': {
    title: 'HRS Staff Intranet',
    lines: ['HRS Staff Intranet', 'Notice: the HRS Continuity Service runs in the background during reviews. Do not stop it.', 'Notice: temps must close their review before the deadline.'],
    links: [['Home', 'http://www.haldenrecords.co.uk/']],
  },
};

export const normalize = (u: string) => u.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
export const lookup = (u: string): Page | null => PAGES[normalize(u)] ?? null;
