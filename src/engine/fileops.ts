import { store } from './state';
import { emit, sfx } from './bus';
import { dialog } from './windows';
import { childByName, isBeneath, isContainer, validName } from './fs';
import type { NodeId } from './types';
import { stamp } from './clock';

const PROTECTED = ['mycomp', 'mydocs', 'bin', 'desktop', 'c', 'd', 'control', 'docset', 'profile', 'win', 'sys32', 'progfiles'];

function err(title: string, text: string) { dialog(title, text, 'error'); sfx('error'); }

export function renameNode(id: NodeId, to: string): boolean {
  const s = store.s;
  const node = s.fs[id];
  if (!node) return false;
  let name = to.trim();
  if (!validName(name)) { err('Error Renaming File or Folder', 'A file name cannot contain any of the following characters:\n\\ / : * ? " < > |'); return false; }
  // When extensions are hidden, keep the original extension unless the player typed one.
  const dot = node.name.lastIndexOf('.');
  if (s.opts.hideExt && !isContainer(node) && dot > 0 && !/\.[a-z0-9]{2,4}$/i.test(name)) name += node.name.slice(dot);
  if (name === node.name) return true;
  if (node.system || PROTECTED.includes(id)) { err('Error Renaming File or Folder', `Cannot rename ${node.name}: Access is denied.`); return false; }
  for (const p of node.parents) {
    const clash = childByName(s.fs, p, name);
    if (clash && clash.id !== id) { err('Error Renaming File or Folder', `Cannot rename ${node.name}: A file with the name you specified already exists. Specify a different file name.`); return false; }
  }
  const from = node.name;
  node.name = name;
  node.modified = stamp();
  store.bump();
  emit({ t: 'rename', id, from, to: name });
  return true;
}

export function moveNode(id: NodeId, to: NodeId, fromParent?: NodeId): boolean {
  const s = store.s;
  const node = s.fs[id];
  const dest = s.fs[to];
  if (!node || !dest || !isContainer(dest) || id === to) return false;
  if (to === 'bin') return deleteNode(id);
  if (to === 'mycomp' || to === 'control' || PROTECTED.includes(id) || node.kind === 'drive') return false;
  if (node.system) { err('Error Moving File or Folder', `Cannot move ${node.name}: Access is denied.`); return false; }
  if (isContainer(node) && isBeneath(s.fs, to, id)) {
    err('Error Moving File or Folder', `Cannot move ${node.name}: The destination folder is a subfolder of the source folder.`);
    return false;
  }
  if (node.parents.includes(to)) return false;
  if (childByName(s.fs, to, node.name)) { err('Error Moving File or Folder', `Cannot move ${node.name}: A file with the same name already exists in the destination folder.`); return false; }
  if (fromParent && node.parents.includes(fromParent)) node.parents = node.parents.map((p) => (p === fromParent ? to : p));
  else node.parents = [to];
  store.bump();
  emit({ t: 'move', id, to });
  return true;
}

export function deleteNode(id: NodeId): boolean {
  const s = store.s;
  const node = s.fs[id];
  if (!node || PROTECTED.includes(id)) return false;
  if (node.system || id === 'carrow' || id === 'hrs') {
    err('Error Deleting File or Folder', `Cannot delete ${node.name}: Access is denied.\n\nMake sure the disk is not full or write-protected and that the file is not currently in use.`);
    return false;
  }
  if (node.parents.includes('bin')) return false;
  node.binFrom = node.parents;
  node.parents = ['bin'];
  sfx('recycle');
  store.bump();
  emit({ t: 'delete', id });
  return true;
}

export function restoreNode(id: NodeId) {
  const node = store.s.fs[id];
  if (!node) return;
  node.parents = node.binFrom?.length ? node.binFrom : ['mydocs'];
  delete node.binFrom;
  store.bump();
}

export function emptyBin() {
  const s = store.s;
  for (const k of Object.keys(s.fs)) {
    const p = s.fs[k].parents;
    if (p.length === 1 && p[0] === 'bin') { (s.flags.purged ??= []).push(k); delete s.fs[k]; }
  }
  sfx('recycle');
  store.bump();
}

export function newNode(parent: NodeId, kind: 'folder' | 'txt'): NodeId {
  const s = store.s;
  const base = kind === 'folder' ? 'New Folder' : 'New Text Document';
  const ext = kind === 'folder' ? '' : '.txt';
  let name = base + ext;
  let i = 2;
  while (childByName(s.fs, parent, name)) name = `${base} (${i++})${ext}`;
  const id = `u${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  s.fs[id] = {
    id, name, kind, parents: [parent], created: stamp(), modified: stamp(),
    content: kind === 'txt' ? '' : undefined, author: s.user,
  };
  store.bump();
  return id;
}

export function saveFile(id: NodeId, content: string): boolean {
  const node = store.s.fs[id];
  if (!node) return false;
  if (node.readOnly) {
    dialog('Save As', `${node.name}\nThis file is set to read-only.\nTry again with a different file name.`, 'warn');
    sfx('error');
    return false;
  }
  node.content = content;
  node.modified = stamp();
  store.bump();
  return true;
}
