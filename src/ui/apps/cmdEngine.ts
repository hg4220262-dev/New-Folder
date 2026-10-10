import { store } from '../../engine/state';
import { children, childByName, isContainer, sizeBytes, resolvePath } from '../../engine/fs';
import { emit } from '../../engine/bus';
import { renameNode, openApp, openPath } from '../../engine/actions';
import { fileText } from './Docs';
import type { NodeId } from '../../engine/types';
import { BRAND } from '../../brand';
import { hrsLog, journalLine } from '../../engine/director';

export interface Shell { cwd: NodeId[] }

export function cwdText(sh: Shell): string {
  const s = store.s;
  const parts = sh.cwd.slice(1).map((id) => s.fs[id]?.name ?? '?');
  return `C:\\${parts.join('\\')}`;
}

function resolve(sh: Shell, arg: string): NodeId[] | null {
  const s = store.s;
  const a = arg.replace(/^"|"$/g, '');
  if (/^[a-z]:/i.test(a)) return resolvePath(s.fs, a, s.fs.profile.name)?.filter((x) => x !== 'mycomp') ?? null;
  // A leading backslash means "from the root of the current drive".
  const st = a.startsWith('\\') ? [sh.cwd[0]] : [...sh.cwd];
  for (const part of a.split('\\').filter(Boolean)) {
    if (part === '..') { if (st.length > 1) st.pop(); continue; }
    if (part === '.') continue;
    const n = childByName(s.fs, st[st.length - 1], part);
    if (!n) return null;
    st.push(n.id);
  }
  return st;
}

const pad = (v: string, n: number) => (v.length >= n ? v : ' '.repeat(n - v.length) + v);

function dir(sh: Shell, args: string): string {
  const s = store.s;
  const all = /\/a/i.test(args);
  const target = args.replace(/\/a\S*/ig, '').trim();
  const st = target ? resolve(sh, target) : sh.cwd;
  if (!st) return 'File Not Found\n';
  const id = st[st.length - 1];
  const list = children(s.fs, id, { hidden: all, system: all, ghosts: all });
  const out = [` Volume in drive C has no label.`, ` Volume Serial Number is 0412-1979`, '', ` Directory of ${cwdText({ cwd: st })}`, ''];
  let files = 0, bytes = 0, dirs = 0;
  for (const n of list) {
    const d = n.modified || '';
    if (isContainer(n)) { dirs++; out.push(`${d}    <DIR>          ${n.name}`); }
    else { files++; const b = sizeBytes(n); bytes += b; out.push(`${d}  ${pad(b.toLocaleString('en-GB'), 16)} ${n.name}`); }
  }
  out.push(`${pad(String(files), 16)} File(s) ${pad(bytes.toLocaleString('en-GB'), 14)} bytes`);
  out.push(`${pad(String(dirs), 16)} Dir(s)   2,412,435,072 bytes free`);
  return out.join('\n') + '\n';
}

export function runCommand(sh: Shell, line: string): string | null {
  const s = store.s;
  const raw = line.trim();
  emit({ t: 'cmd', line: raw });
  if (!raw) return '';
  const [cmd0] = raw.split(/\s+/);
  const cmd = cmd0.toLowerCase();
  const rest = raw.slice(cmd0.length).trim();
  switch (cmd) {
    case 'cls': return null;
    case 'ver': return `\n${BRAND.shellBanner}\n`;
    case 'whoami': return `${s.fs.profile.name.toLowerCase().includes('dunmore') ? 'carrow\\dunmore' : `laptop-0411\\${s.user.toLowerCase()}`}\n`;
    case 'date': return 'The current date is: Thu 14/08/2008\n';
    case 'echo': return rest + '\n';
    case 'help': return 'For more information on a specific command, type HELP command-name\nATTRIB  CD  CLS  DIR  ECHO  EXIT  REN  TASKLIST  TASKKILL  TYPE  VER\n';
    case 'exit': return '__EXIT__';
    case 'dir': return dir(sh, rest);
    case 'cd': case 'chdir': {
      if (!rest) return cwdText(sh) + '\n';
      if (rest === '\\') { sh.cwd = ['c']; return ''; }
      const st = resolve(sh, rest);
      if (!st || !isContainer(s.fs[st[st.length - 1]])) return 'The system cannot find the path specified.\n';
      sh.cwd = st;
      return '';
    }
    case 'type': {
      const st = resolve(sh, rest);
      const n = st ? s.fs[st[st.length - 1]] : undefined;
      if (!n || isContainer(n)) return 'The system cannot find the file specified.\n';
      if (n.kind === 'img') return 'ÿØÿà\u0010JFIF\u0001\u0001\u0001H H ÿÛ C\n';
      return fileText(n) + '\n';
    }
    case 'attrib': {
      const st = resolve(sh, rest.replace(/[-+][rhs]/ig, '').trim() || '.');
      if (!st) return 'File not found\n';
      const n = s.fs[st[st.length - 1]];
      if (/-h/i.test(rest)) { if (n.system && n.id.startsWith('hrs')) return `Access denied - ${n.name}\n`; n.hidden = false; n.ghost = false; store.bump(); return ''; }
      if (/\+h/i.test(rest)) { n.hidden = true; store.bump(); return ''; }
      return `${n.readOnly ? ' R' : '  '}${n.hidden || n.ghost ? 'H' : ' '}${n.system ? 'S' : ' '}   ${cwdText({ cwd: st })}\n`;
    }
    case 'ren': case 'rename': {
      const m = /^("[^"]+"|\S+)\s+("[^"]+"|.+)$/.exec(rest);
      if (!m) return 'The syntax of the command is incorrect.\n';
      const st = resolve(sh, m[1]);
      if (!st) return 'The system cannot find the file specified.\n';
      const ok = renameNode(st[st.length - 1], m[2].replace(/^"|"$/g, ''));
      return ok ? '' : 'Access is denied.\n';
    }
    case 'tasklist': {
      const procs = ['System Idle Process', 'System', 'smss.exe', 'csrss.exe', 'winlogon.exe', 'services.exe', 'lsass.exe', 'svchost.exe', 'explorer.exe', 'hrsassist.exe', 'hrscont.exe', 'cmd.exe'];
      return '\nImage Name                   PID Session Name     Mem Usage\n========================= ====== ================ ============\n' +
        procs.map((p, i) => `${p.padEnd(25)} ${pad(String(i * 4 + (p === 'hrscont.exe' ? 412 : 0)), 6)} Console          ${pad(p === 'hrscont.exe' ? '43,500 K' : `${(i + 2) * 1300} K`, 12)}`).join('\n') + '\n';
    }
    case 'taskkill': case 'tskill': case 'sc': case 'net':
      if (/hrsassist/i.test(rest)) return 'ERROR: The process "hrsassist.exe" could not be terminated.\nReason: Access is denied.\n';
      return /hrscont|hrs/i.test(rest) ? (s.chapter >= 5 ? 'SUCCESS: Sent termination signal to the process "hrscont.exe".\n' : 'ERROR: The process "hrscont.exe" could not be terminated.\nReason: Access is denied.\n') : 'ERROR: The process not found.\n';
    case 'hrsfilter': {
      const on = !s.flags.webUnblocked;
      const m = /\/unlock\s+(\S+)/i.exec(rest);
      if (m) {
        if (!on) return 'Web filter is already off.\n';
        if ((s.flags.webLock ?? 0) > s.playMs) return 'Access denied. Too many failed attempts. Try again later.\n';
        if (m[1].toLowerCase() === 'marigold-tea') {
          s.flags.webUnblocked = true; s.flags.webFails = 0;
          hrsLog('Web filter switched off by the reviewer from the command prompt.', 'Warning');
          journalLine('Reviewer switched off the web filter.\nThe reviewer is looking outside the archive.');
          return 'Phrase accepted. HRS web filter: OFF.\n';
        }
        s.flags.webFails = (s.flags.webFails ?? 0) + 1;
        hrsLog('Failed attempt to switch off the web filter.', 'Warning');
        if (s.flags.webFails >= 3) { s.flags.webFails = 0; s.flags.webLock = s.playMs + 120_000; return 'Access denied. Locked out for 2 minutes.\n'; }
        return 'Access denied. Incorrect phrase.\n';
      }
      if (/\/on/i.test(rest)) { s.flags.webUnblocked = false; return 'HRS web filter: ON.\n'; }
      return `HRSFILTER [/UNLOCK phrase | /ON]\n\nThe phrase is set in the filter's configuration file.\nWeb filter is currently ${on ? 'ON' : 'OFF'}.\n`;
    }
    case 'hscjoin': openApp('app:joiner'); return '';
    case 'notepad': openApp('app:notepad'); return '';
    case 'explorer': openPath(sh.cwd.length > 1 ? ['mycomp', ...sh.cwd] : ['mycomp', 'c']); return '';
    default: return `'${cmd0}' is not recognized as an internal or external command,\noperable program or batch file.\n`;
  }
}
