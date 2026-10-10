// The static pages Internet Explorer can open. Edit this list to allow more.
// Anything else shows "page cannot be displayed", except the storage cluster (HSC_HOST in storage.ts), which Ie.tsx hands to Hsc.tsx.
export interface Page { title: string; lines: string[]; links?: [string, string][] }

export const HOME = 'http://www.haldenrecords.co.uk/';

const PAGES: Record<string, Page> = {
  'www.haldenrecords.co.uk': {
    title: 'Halden Records Services Ltd.',
    lines: ['Halden Records Services Ltd.', 'Document scanning, indexing and certified digital archives for councils, utilities and other public bodies.', '', 'Services: bulk scanning of paper and microfilm, indexing, certified digital record, secure disposal of originals.', 'Clients include Wendell Utilities plc.', '', 'Enquiries: info@haldenrecords.co.uk. Site last updated 4 August 2008.'],
    links: [['Staff intranet', 'http://intranet.haldenrecords.co.uk/'], ['About the Carrow project', 'http://www.haldenrecords.co.uk/carrow']],
  },
  'www.haldenrecords.co.uk/carrow': {
    title: 'The Carrow Archive - Halden Records',
    lines: ['The Carrow Archive', 'Client: Wendell Utilities plc, successor to the Wendell Water Board.', 'Wendell Water Board papers on the Carrow Reservoir Scheme, 1977-1980. 6 boxes, 1,184 items, scanned and indexed at Halden.', '', 'Status: under review. Certification of the digital record and disposal of the originals are expected in August 2008.'],
    links: [['Home', 'http://www.haldenrecords.co.uk/']],
  },
  'intranet.haldenrecords.co.uk': {
    title: 'HRS Staff Intranet',
    lines: ['HRS Staff Intranet', 'IT: reviewer laptops run HRS Archive Tools 2.1. The Continuity Service is a system service. Do not stop it while a review is open.', 'IT: storage cluster Rack 2 (Plant Room) switch not responding since March. Fetches from Rack 2 time out.', 'Admin: reviews are to be closed by the contract deadline. Late sign-off delays disposal and the final invoice.', 'Admin: timesheets by Friday 12:00.'],
    links: [['Home', 'http://www.haldenrecords.co.uk/']],
  },
};

export const normalize = (u: string) => u.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
export const lookup = (u: string): Page | null => PAGES[normalize(u)] ?? null;
