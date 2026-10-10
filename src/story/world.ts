import type { FS } from '../engine/fs';
import type { FNode } from '../engine/types';
import type { LogEntry } from '../engine/state';
import { makeCtx, type Ctx } from './ctx';
import { baseNodes } from './world_base';
import { carrowAdmin, carrowRelocation } from './world_carrow1';
import { carrowRecords } from './world_carrow2';
import { unmatched, agentFiles, continuityIni } from './world_hidden';
import { mails, schoolRegister } from './world_mail';
import { journal } from './journal';
import { extraArchive, extraPersonal, extraMail } from './world_extra';
import { adminNodes } from './world_admin';

export function buildWorld(user: string, full: string): FS {
  const c = makeCtx(user, full);
  const nodes: FNode[] = [
    ...baseNodes(c), ...carrowAdmin(), ...carrowRelocation(), ...carrowRecords(),
    ...unmatched(), ...agentFiles(c), ...mails(c), ...extraArchive(), ...extraPersonal(c), ...extraMail(c), ...adminNodes(c),
  ];
  const fs: FS = {};
  for (const node of nodes) fs[node.id] = node;
  return fs;
}

/** Resolve placeholder contents that depend on the story state. */
export function liveContent(node: FNode, c: Ctx, ch: number, flags: Record<string, any>): string {
  const raw = node.content ?? '';
  if (raw === '@@INI@@') return continuityIni(c, ch);
  if (raw === '@@JOURNAL@@') return journal(c, flags.jl ?? []);
  if (raw === '@@REGISTER@@') return schoolRegister(c, !!flags.youInRegister);
  return raw;
}

export { makeCtx };

export function logEntry(p: Omit<LogEntry, 'id' | 'ev' | 'cat' | 'log'> & Partial<Pick<LogEntry, 'id' | 'ev' | 'cat' | 'log'>>): LogEntry {
  return { id: p.id ?? 0, ev: p.ev ?? 1001, cat: p.cat ?? 'None', log: p.log ?? 'Application', ...p };
}

const d = (s: string) => {
  const [date, time] = s.split(' ');
  const [dd, mm, yy] = date.split('/').map(Number);
  const [h, m] = time.split(':').map(Number);
  return new Date(yy, mm - 1, dd, h, m).getTime();
};

export const HRS_VAGUE = 'The description for Event ID ( 1001 ) in Source ( HRSCont ) cannot be found. The local computer may not have the necessary registry information.';

export function seedLog(): LogEntry[] {
  const hrs = (at: string, text: string, vague = HRS_VAGUE, type: LogEntry['type'] = 'Information') =>
    logEntry({ type, at: d(at), source: 'HRSCont', text, vague });
  return [
    logEntry({ type: 'Information', at: d('11/08/2008 09:37'), source: 'EventLog', text: 'The Event log service was started.', log: 'System', ev: 6005 }),
    logEntry({ type: 'Information', at: d('11/08/2008 09:38'), source: 'MsiInstaller', text: 'Product: HRS Archive Tools 2.1 -- Installation completed successfully.', ev: 11707 }),
    logEntry({ type: 'Information', at: d('11/08/2008 09:38'), source: 'HRSAssist', text: 'HRS Archive Assistant started. Path: C:\\WINDOWS\\system32\\hrsassist\\hrsassist.exe', ev: 1000 }),
    logEntry({ type: 'Information', at: d('11/08/2008 09:38'), source: 'Service Control Manager', text: 'The HRS Continuity Service service was successfully started. Path: C:\\WINDOWS\\system32\\hrscont\\hrscont.exe', log: 'System', ev: 7036 }),
    hrs('11/08/2008 10:15', 'Archive loaded. 23 records could not be matched to the Authority document.', undefined, 'Warning'),
    hrs('11/08/2008 10:16', '23 unmatched records were hidden from the reviewer and continued. Journal: C:\\WINDOWS\\system32\\hrscont\\journal.log'),
    logEntry({ type: 'Warning', at: d('12/08/2008 02:12'), source: 'Disk', text: 'An error was detected on device \\Device\\Harddisk0\\D1 during a paging operation.', log: 'System', ev: 51 }),
  ].map((e, i) => ({ ...e, id: i + 1 }));
}
