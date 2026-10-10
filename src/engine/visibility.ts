import { store } from './state';
import type { NodeId } from './types';

/** Folder ids currently displayed in any visible Explorer window (plus the desktop). */
export function foldersOnScreen(): Set<NodeId> {
  const out = new Set<NodeId>(['desktop']);
  for (const w of store.s.windows) {
    if (w.min) continue;
    if (w.app === 'explorer' && w.path?.length && w.search == null) out.add(w.path[w.path.length - 1]);
  }
  return out;
}

/** Files currently open (or shown in Properties) in a visible window. */
export function filesOnScreen(): Set<NodeId> {
  const out = new Set<NodeId>();
  for (const w of store.s.windows) if (!w.min && w.fileId) out.add(w.fileId);
  return out;
}

/** Is this node visible to the player right now? Used so changes happen while nobody is looking. */
export function onScreen(id: NodeId): boolean {
  const s = store.s;
  if (filesOnScreen().has(id)) return true;
  const folders = foldersOnScreen();
  if (folders.has(id)) return true;
  const node = s.fs[id];
  if (!node) return false;
  if (node.parents.some((p) => folders.has(p))) return true;
  // Search results windows show files anywhere.
  for (const w of s.windows) if (!w.min && w.app === 'explorer' && w.search != null) return true;
  return false;
}
