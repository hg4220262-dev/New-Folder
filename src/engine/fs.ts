import type { FNode, NodeId, FileKind } from './types';

export type FS = Record<NodeId, FNode>;

/** Which account is logged on (set by the Welcome screen). */
export const session = { admin: false };

export interface ViewOpts { hidden: boolean; system: boolean; ghosts?: boolean }

const ORDER: Partial<Record<FileKind, number>> = { computer: 0, drive: 1, bin: 2, folder: 3 };

export function sortNodes(list: FNode[]): FNode[] {
  return list.sort((a, b) => {
    const oa = ORDER[a.kind] ?? 9, ob = ORDER[b.kind] ?? 9;
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
  });
}

export function isContainer(n: FNode | undefined): boolean {
  return !!n && (n.kind === 'folder' || n.kind === 'drive' || n.kind === 'computer' || n.kind === 'bin');
}

export function visibleIn(n: FNode, o: ViewOpts): boolean {
  if (n.adminOnly && !session.admin) return false;
  if (o.ghosts) return true;
  if (n.ghost) return false;
  if (n.system && !o.system) return false;
  if (n.hidden && !o.hidden) return false;
  return true;
}

export function children(fs: FS, id: NodeId, o: ViewOpts): FNode[] {
  const out: FNode[] = [];
  for (const k in fs) {
    const n = fs[k];
    if (n.parents.includes(id) && visibleIn(n, o)) out.push(n);
  }
  return sortNodes(out);
}

export function childByName(fs: FS, parent: NodeId, name: string): FNode | undefined {
  const lower = name.toLowerCase();
  for (const k in fs) {
    const n = fs[k];
    if (n.parents.includes(parent) && n.name.toLowerCase() === lower && !(n.adminOnly && !session.admin)) return n;
  }
  return undefined;
}

export function displayName(n: FNode, showExt: boolean): string {
  if (isContainer(n)) return n.name;
  const i = n.name.lastIndexOf('.');
  if (i <= 0) return n.name;
  if (n.kind === 'lnk' || !showExt) return n.name.slice(0, i);
  return n.name;
}

export function typeName(n: FNode): string {
  switch (n.kind) {
    case 'folder': return 'File Folder';
    case 'drive': return n.id === 'd' ? 'CD Drive' : 'Local Disk';
    case 'computer': return 'System Folder';
    case 'bin': return 'Recycle Bin';
    case 'txt': return 'Text Document';
    case 'log': return 'Text Document';
    case 'doc': return 'WordPad Document';
    case 'img': return 'JPEG Image';
    case 'xls': return 'Worksheet';
    case 'eml': return 'E-mail Message';
    case 'ini': return 'Configuration Settings';
    case 'exe': return 'Application';
    case 'lnk': return 'Shortcut';
    case 'dat': return 'DAT File';
  }
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function sizeBytes(n: FNode): number {
  if (n.size != null) return n.size;
  if (n.rows) return 2048 + n.rows.reduce((a, r) => a + r.join(',').length, 0) * 4;
  if (n.kind === 'img') return 48_000 + (hash(n.id) % 90_000);
  return (n.content ?? '').length;
}

export function sizeLabel(n: FNode): string {
  if (isContainer(n)) return '';
  const b = sizeBytes(n);
  const kb = Math.max(b === 0 ? 0 : 1, Math.ceil(b / 1024));
  return `${kb.toLocaleString('en-GB')} KB`;
}

/** True when `maybeChild` sits somewhere beneath `ancestor` (follows every parent). */
export function isBeneath(fs: FS, maybeChild: NodeId, ancestor: NodeId, seen = new Set<NodeId>()): boolean {
  if (maybeChild === ancestor) return true;
  if (seen.has(maybeChild)) return false;
  seen.add(maybeChild);
  const n = fs[maybeChild];
  if (!n) return false;
  return n.parents.some((p) => isBeneath(fs, p, ancestor, seen));
}

/** Searchable text of a node (name + body + spreadsheet cells + comments). */
export function textOf(n: FNode): string {
  const rows = n.rows ? n.rows.map((r) => r.join(' ')).join('\n') : '';
  return `${n.content ?? ''}\n${rows}\n${n.comments ?? ''}`;
}

export function validName(name: string): boolean {
  return !!name.trim() && !/[\\/:*?"<>|]/.test(name);
}

export function searchFS(fs: FS, q: string, o: ViewOpts & { inContent: boolean }): FNode[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const out: FNode[] = [];
  for (const k in fs) {
    const n = fs[k];
    if (n.unsearchable || n.ghost || n.parents.includes('bin') || !n.parents.length) continue;
    if (!visibleIn(n, o)) continue;
    if (n.kind === 'computer' || n.kind === 'drive') continue;
    const hit = n.name.toLowerCase().includes(needle) || (o.inContent && textOf(n).toLowerCase().includes(needle));
    if (hit) out.push(n);
  }
  return sortNodes(out);
}

export const SPECIAL_ROOTS: NodeId[] = ['desktop', 'mycomp', 'mydocs', 'bin', 'control'];

export function userRoot(user: string): string {
  return `C:\\Documents and Settings\\${user}`;
}

/** Address-bar text for a navigation stack. */
export function addressOf(fs: FS, stack: NodeId[], user: string): string {
  const cur = stack[stack.length - 1];
  const node = fs[cur];
  if (!node) return '';
  if (SPECIAL_ROOTS.includes(cur)) return node.name;
  let start = -1;
  for (let i = stack.length - 1; i >= 0; i--) {
    const k = fs[stack[i]]?.kind;
    if (k === 'drive' || stack[i] === 'mydocs' || stack[i] === 'desktop') { start = i; break; }
  }
  if (start < 0) return node.name;
  const base = fs[stack[start]];
  const rest = stack.slice(start + 1).map((id) => fs[id]?.name ?? '?');
  let prefix: string;
  if (base.kind === 'drive') prefix = base.id.toUpperCase() + ':';
  else if (base.id === 'mydocs') prefix = `${userRoot(user)}\\My Documents`;
  else prefix = `${userRoot(user)}\\Desktop`;
  if (!rest.length && base.kind === 'drive') return prefix + '\\';
  return [prefix, ...rest].join('\\');
}

/** Canonical stack for a node, following first parents up to a root. */
export function canonicalStack(fs: FS, id: NodeId): NodeId[] {
  const out: NodeId[] = [];
  let cur: NodeId | undefined = id;
  const seen = new Set<NodeId>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    out.unshift(cur);
    if (SPECIAL_ROOTS.includes(cur)) break;
    if (fs[cur]?.kind === 'drive') { out.unshift('mycomp'); break; }
    cur = fs[cur]?.parents[0];
  }
  return out;
}

/** Resolve a typed path like C:\HRS\Carrow into a navigation stack. */
export function resolvePath(fs: FS, raw: string, user: string): NodeId[] | null {
  let p = raw.trim().replace(/^"|"$/g, '').replace(/\//g, '\\');
  if (!p) return null;
  const specials: Record<string, NodeId> = {
    'my computer': 'mycomp', 'my documents': 'mydocs', desktop: 'desktop',
    'recycle bin': 'bin', 'control panel': 'control',
  };
  if (specials[p.toLowerCase()]) return [specials[p.toLowerCase()]];
  p = p.replace(/%userprofile%/i, userRoot(user));
  // Map the user's profile onto the special My Documents / Desktop roots.
  const prof = userRoot(user).toLowerCase();
  let stack: NodeId[];
  let rest: string;
  if (p.toLowerCase().startsWith(prof + '\\my documents')) {
    stack = ['mydocs']; rest = p.slice((prof + '\\my documents').length);
  } else if (p.toLowerCase().startsWith(prof + '\\desktop')) {
    stack = ['desktop']; rest = p.slice((prof + '\\desktop').length);
  } else {
    const m = /^([a-z]):\\?(.*)$/i.exec(p);
    if (!m) return null;
    const drive = m[1].toLowerCase();
    if (!fs[drive] || fs[drive].kind !== 'drive') return null;
    stack = ['mycomp', drive]; rest = m[2];
  }
  for (const part of rest.split('\\').filter(Boolean)) {
    if (part === '..') { if (stack.length > 1 && fs[stack[stack.length - 1]].kind !== 'drive') stack.pop(); continue; }
    if (part === '.') continue;
    const next = childByName(fs, stack[stack.length - 1], part);
    if (!next || !isContainer(next)) {
      if (next) return [...stack, next.id];
      return null;
    }
    stack.push(next.id);
  }
  return stack;
}

