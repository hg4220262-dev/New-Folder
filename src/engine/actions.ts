import { store } from './state';
import { emit, sfx } from './bus';
import { openWin, dialog, getWin } from './windows';
import { canonicalStack, isContainer, displayName } from './fs';
import type { AppKind, FNode, NodeId } from './types';
import { stamp } from './clock';
import { blockedByPolicy } from '../story/policy';

export * from './fileops';

/**
 * Old machines took a moment. Anything the player opens waits a beat first, hourglass up and
 * the disk ticking, so the laptop feels like it is thinking. Opens keep their order, and a
 * double double-click does not open the same thing twice. Off under test (no document).
 */
const WAIT: Record<'app' | 'file' | 'folder', [number, number]> = { app: [380, 820], file: [240, 560], folder: [90, 240] };
const pendingKeys = new Set<string>();
let lastDue = 0;
function lag(kind: keyof typeof WAIT, key: string, f: () => void) {
  if (typeof document === 'undefined' || store.settings.oldLag === false) { f(); return; }
  if (pendingKeys.has(key)) return;
  const [lo, hi] = WAIT[kind];
  const now = performance.now();
  const due = Math.max(now + lo + Math.random() * (hi - lo), lastDue + 60);
  lastDue = due;
  pendingKeys.add(key);
  store.ui.wait++;
  store.bump();
  if (due - now > 330) sfx('hddseek');
  setTimeout(() => {
    pendingKeys.delete(key);
    store.ui.wait = Math.max(0, store.ui.wait - 1);
    f();
    store.bump();
  }, due - now);
}

const APP_FOR: Partial<Record<FNode['kind'], AppKind>> = {
  txt: 'notepad', log: 'notepad', ini: 'notepad', doc: 'wordpad', img: 'image', xls: 'sheet', eml: 'mail',
};

export function openApp(target: string, extra: Record<string, any> = {}) {
  const app = target.replace('app:', '') as AppKind | 'review';
  if (app === 'review') { emit({ t: 'action', id: 'review' }); return; }
  if (blockedByPolicy(app)) return;
  const titles: Partial<Record<AppKind, string>> = {
    cmd: 'C:\\WINDOWS\\system32\\cmd.exe', events: 'Event Viewer', taskmgr: 'Windows Task Manager',
    folderopts: 'Folder Options', notepad: 'Untitled - Notepad', wordpad: 'Document - WordPad', run: 'Run',
    mail: 'Inbox - Mail', ie: 'Microsoft Internet Explorer', console: 'HRS Service Console', joiner: 'HSC Join Utility', linkterm: 'Carrow Link Terminal',
  };
  const sizes: Partial<Record<AppKind, { w: number; h: number }>> = { mail: { w: 660, h: 470 } };
  const open = () => openWin({ app: app as AppKind, title: titles[app as AppKind] ?? app, ...(sizes[app as AppKind] ?? {}), ...extra });
  // Small shell dialogs come up at once; programs take a moment to load.
  if (app === 'run' || app === 'folderopts' || app === 'about') open(); else lag('app', `app:${app}`, open);
}

export function openPath(stack: NodeId[], fromWin?: string) {
  const w = fromWin ? getWin(fromWin) : undefined;
  if (w && w.app === 'explorer') { navigate(w.id, stack); return; }
  const cur = store.s.fs[stack[stack.length - 1]];
  lag('folder', `path:${stack[stack.length - 1]}`, () => {
    openWin({ app: 'explorer', title: cur?.name ?? 'Explorer', path: stack, back: [], fwd: [], search: null });
    emit({ t: 'view', id: stack[stack.length - 1] });
  });
}

export function navigate(winId: string, stack: NodeId[], push = true) {
  if (!getWin(winId)) return;
  lag('folder', `nav:${winId}:${stack[stack.length - 1]}`, () => {
    const w = getWin(winId);
    if (!w) return;
    if (push && w.path) { w.back = [...(w.back ?? []), w.path]; w.fwd = []; }
    w.path = stack;
    w.search = null;
    w.title = store.s.fs[stack[stack.length - 1]]?.name ?? '';
    store.bump();
    emit({ t: 'view', id: stack[stack.length - 1] });
  });
}

function brokenShortcut(name: string) {
  dialog('Problem with Shortcut', `The item '${name}' that this shortcut refers to has been changed or moved, so this shortcut will no longer work properly.`, 'warn');
  sfx('error');
}

/** Open a node (double-click). `stack` is the folder path it was opened from. */
export function openNode(id: NodeId, fromWin?: string, stack?: NodeId[]) {
  const s = store.s;
  const node = s.fs[id];
  if (!node) { brokenShortcut('Unknown'); return; }
  if (node.kind === 'lnk' || node.kind === 'exe') {
    if (node.locked) { dialog(node.name, node.locked, 'error'); sfx('error'); return; }
    const t = node.target;
    if (!t) return;
    if (t.startsWith('app:')) { openApp(t); return; }
    if (!s.fs[t] || !s.fs[t].parents.length || s.fs[t].parents.includes('bin')) { brokenShortcut(node.name.replace(/\.lnk$/, '')); return; }
    openNode(t);
    return;
  }
  if (isContainer(node)) {
    openPath(stack ? [...stack, id] : canonicalStack(s.fs, id), fromWin);
    return;
  }
  if (node.locked) { dialog(displayName(node, !s.opts.hideExt), node.locked, 'error'); sfx('error'); return; }
  const app = APP_FOR[node.kind];
  if (!app) {
    dialog('Windows', `Windows cannot open this file:\n\nFile: ${node.name}\n\nTo open this file, Windows needs to know what program created it.`, 'info');
    return;
  }
  const existing = s.windows.find((w) => w.fileId === id && w.app === app);
  // Reading a file again still counts as reading it (Accessed time, Recent list, story triggers).
  const record = () => {
    node.accessed = stamp();
    if (node.mail) node.mail.unread = false;
    if (!s.opened.includes(id)) s.opened.push(id);
    s.recent = [id, ...s.recent.filter((r) => r !== id)].slice(0, 12);
    store.bump();
    emit({ t: 'open', id });
  };
  if (existing) { existing.min = false; existing.z = ++s.z; record(); return; }
  lag('file', `file:${id}`, () => {
    const label = displayName(node, !s.opts.hideExt);
    const titles: Partial<Record<AppKind, string>> = {
      notepad: `${label} - Notepad`, wordpad: `${label} - WordPad`, image: `${label} - Picture and Fax Viewer`,
      sheet: `${label} - Worksheet Viewer`, mail: `${node.mail?.subject ?? label} - Message`,
    };
    openWin({ app, title: titles[app] ?? label, fileId: id });
    record();
  });
}

export function showProps(id: NodeId) {
  const node = store.s.fs[id];
  if (!node) return;
  openWin({ app: 'props', title: `${displayName(node, !store.s.opts.hideExt)} Properties`, fileId: id, tab: 'general' });
}
