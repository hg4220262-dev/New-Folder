import { store, type MenuItem } from '../../engine/state';
import { openNode, showProps, deleteNode, restoreNode, emptyBin, newNode, openApp } from '../../engine/actions';
import { isContainer } from '../../engine/fs';
import type { NodeId } from '../../engine/types';

/** Shared rename request: Explorer/desktop subscribe and enter edit mode for this id. */
export const renameReq = { id: null as NodeId | null };
export function beginRename(id: NodeId) { renameReq.id = id; store.bump(); }

export function itemMenu(id: NodeId, fromWin?: string, stack?: NodeId[]): MenuItem[] {
  const s = store.s;
  const n = s.fs[id];
  if (!n) return [];
  const inBin = n.parents.length === 1 && n.parents[0] === 'bin';
  if (inBin) {
    return [
      { label: 'Restore', bold: true, run: () => restoreNode(id) },
      { sep: true },
      { label: 'Cut', disabled: true },
      { label: 'Delete', disabled: true },
      { sep: true },
      { label: 'Properties', run: () => showProps(id) },
    ];
  }
  const special = ['mycomp', 'bin', 'mydocs', 'c', 'd', 'control'].includes(id);
  return [
    { label: 'Open', bold: true, run: () => openNode(id, fromWin, stack) },
    ...(isContainer(n) && !special ? [{ label: 'Explore', run: () => openNode(id) }] : []),
    ...(n.kind === 'txt' || n.kind === 'log' || n.kind === 'ini' || n.kind === 'dat' ? [{ label: 'Open With Notepad', run: () => openApp('app:notepad', { fileId: id, title: `${n.name} - Notepad` }) }] : []),
    { sep: true },
    { label: 'Send To', sub: [{ label: 'Desktop (create shortcut)', disabled: true }, { label: 'Mail Recipient', disabled: true }] },
    { sep: true },
    { label: 'Cut', disabled: special },
    { label: 'Copy', disabled: special },
    { sep: true },
    { label: 'Delete', disabled: special, run: () => deleteNode(id) },
    { label: 'Rename', disabled: special, run: () => beginRename(id) },
    { sep: true },
    { label: 'Properties', run: () => showProps(id) },
  ];
}

export function folderMenu(folder: NodeId, refresh: () => void): MenuItem[] {
  const s = store.s;
  if (folder === 'bin') {
    return [{ label: 'Empty Recycle Bin', run: () => emptyBin() }, { sep: true }, { label: 'Refresh', run: refresh }];
  }
  const ro = folder === 'mycomp' || folder === 'control';
  return [
    { label: 'View', sub: [{ label: 'Tiles', checked: true }, { label: 'Details', run: () => {} }] },
    { label: 'Arrange Icons By', sub: [{ label: 'Name', checked: true }, { label: 'Type' }, { label: 'Modified' }] },
    { label: 'Refresh', run: refresh },
    { sep: true },
    { label: 'Paste', disabled: true },
    { sep: true },
    { label: 'New', disabled: ro, sub: [
      { label: 'Folder', run: () => beginRename(newNode(folder, 'folder')) },
      { sep: true },
      { label: 'Text Document', run: () => beginRename(newNode(folder, 'txt')) },
    ] },
    { sep: true },
    { label: 'Properties', run: () => showProps(folder), disabled: !s.fs[folder] },
  ];
}
