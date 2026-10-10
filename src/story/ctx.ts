import type { FNode, FileKind, NodeId } from '../engine/types';

export interface Ctx {
  user: string;     // account / first name, e.g. "Reona"
  full: string;     // full name, e.g. "Reona Monga"
  surname: string;  // e.g. "Monga" (may equal user when unknown)
}

export function makeCtx(user: string, full: string): Ctx {
  const parts = (full || user).trim().split(/\s+/);
  const surname = parts.length > 1 ? parts[parts.length - 1] : user;
  return { user, full: full || user, surname };
}

/** Node factory used by the story files. */
export function n(id: NodeId, name: string, kind: FileKind, parents: NodeId[], extra: Partial<FNode> = {}): FNode {
  return {
    id, name, kind, parents,
    created: extra.created ?? '11/08/2008 09:40',
    modified: extra.modified ?? extra.created ?? '11/08/2008 09:40',
    ...extra,
  };
}

/** Stamp on everything HRS scanned in. */
export const scan = { created: '11/08/2008 10:14', modified: '11/08/2008 10:14', readOnly: true, author: 'HRS Scanning' };
