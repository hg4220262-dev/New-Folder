import { store } from '../../engine/state';
import { children, searchFS, textOf } from '../../engine/fs';
import type { FNode, NodeId, Win } from '../../engine/types';

/** Items shown in an Explorer window, including the Continuity Service's search manipulation. */
export function viewFor(win: Win): FNode[] {
  const s = store.s;
  const o = { hidden: s.opts.showHidden, system: s.opts.showSystem };
  if (win.search != null) {
    const q = win.search.trim().toLowerCase();
    let items = searchFS(s.fs, q, { ...o, inContent: true });
    // Chapter 2: the Search Companion quietly returns nothing for Mill Row terms...
    if (s.suppress.some((w) => q.includes(w))) {
      items = items.filter((n) => {
        // ...except one photograph caption it forgot to scrub.
        return n.id === 'scan412_vis' && !!n.comments?.toLowerCase().includes(q);
      });
    }
    // Chapter 4+: searching your own name finds things it should not.
    if (s.chapter >= 4 && q && s.user.toLowerCase().includes(q) && q.length >= 3) {
      for (const id of ['regp2', 'hrsini', 'notes']) {
        const n = s.fs[id];
        if (n && !items.includes(n) && n.parents.length) items.push(n);
      }
    }
    return items;
  }
  const cur = win.path?.[win.path.length - 1] ?? 'desktop';
  const items = children(s.fs, cur, o);
  if (cur === 'mycomp') return items.filter((n) => n.kind === 'drive' || n.id === 'control');
  return items;
}

/** Snippet of the matched text, for search results. */
export function snippet(n: FNode, q: string): string {
  const t = textOf(n).replace(/\s+/g, ' ');
  const i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return '';
  return '…' + t.slice(Math.max(0, i - 20), i + q.length + 30) + '…';
}

export function locationOf(id: NodeId): string {
  const s = store.s;
  const n = s.fs[id];
  if (!n?.parents.length) return '';
  return s.fs[n.parents[0]]?.name ?? '';
}
