import { useState } from 'react';
import { store } from '../../engine/state';
import { openNode, navigate, deleteNode } from '../../engine/actions';
import { addressOf, resolvePath, canonicalStack, isContainer, SPECIAL_ROOTS } from '../../engine/fs';
import { dialog } from '../../engine/windows';
import { sfx } from '../../engine/bus';
import type { FNode, NodeId, Win } from '../../engine/types';
import { NodeIcon } from '../icons';
import { openMenu } from '../Menu';
import { TaskPane } from './TaskPane';
import { ItemView } from './ItemView';
import { SearchPane } from './SearchPane';
import { itemMenu, folderMenu, beginRename } from './fileMenu';
import { viewFor, locationOf, snippet } from './explorerModel';
import { ExplorerMenuBar, ExplorerToolbar, AddressBar } from './ExplorerChrome';

export function Explorer({ win }: { win: Win }) {
  const s = store.s;
  const [sel, setSel] = useState<NodeId | null>(null);
  const [mode, setMode] = useState<'tiles' | 'details'>('tiles');
  const [q, setQ] = useState('');
  const [searchPane, setSearchPane] = useState(false);
  const [, force] = useState(0);
  const refresh = () => force((x) => x + 1);
  const stack = win.path ?? ['desktop'];
  const cur = stack[stack.length - 1];
  const items = viewFor(win);
  const address = win.search != null ? 'Search Results' : addressOf(s.fs, stack, s.fs.profile.name);

  const back = () => {
    const b = win.back ?? [];
    if (!b.length) return;
    win.fwd = [...(win.fwd ?? []), stack];
    win.back = b.slice(0, -1);
    navigate(win.id, b[b.length - 1], false);
  };
  const fwd = () => {
    const f = win.fwd ?? [];
    if (!f.length) return;
    win.back = [...(win.back ?? []), stack];
    win.fwd = f.slice(0, -1);
    navigate(win.id, f[f.length - 1], false);
  };
  const up = () => {
    if (win.search != null) { navigate(win.id, stack); return; }
    const node = s.fs[cur];
    if (node?.upTo) { navigate(win.id, canonicalStack(s.fs, node.upTo)); return; }
    if (stack.length > 1) navigate(win.id, stack.slice(0, -1));
    else if (cur !== 'desktop') navigate(win.id, ['desktop']);
  };
  const go = (text: string) => {
    const st = resolvePath(s.fs, text, s.fs.profile.name);
    if (!st) {
      dialog(text, `Windows cannot find '${text}'. Check the spelling and try again, or try searching for the item by clicking Start and then clicking Search.`, 'error');
      sfx('error');
      return;
    }
    const last = s.fs[st[st.length - 1]];
    if (isContainer(last)) navigate(win.id, st);
    else openNode(last.id);
  };
  const runSearch = () => {
    if (!q.trim()) return;
    win.search = q;
    win.title = 'Search Results';
    store.bump();
  };
  const open = (id: NodeId) => {
    const node = s.fs[id];
    if (win.search != null) { openNode(id); return; }
    const keep = isContainer(node) && node.kind !== 'drive' && !SPECIAL_ROOTS.includes(id);
    openNode(id, win.id, keep ? stack : undefined);
  };
  const keys = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'F2' && sel) beginRename(sel);
    if (e.key === 'Delete' && sel) deleteNode(sel);
    if (e.key === 'Enter' && sel) open(sel);
    if (e.key === 'Backspace') up();
  };
  const sub = win.search != null
    ? (n: FNode) => { const sn = snippet(n, win.search!); return `In ${locationOf(n.id)}${sn ? `: ${sn}` : ''}`; }
    : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, outline: 'none' }} tabIndex={-1} onKeyDown={keys}>
      <ExplorerMenuBar win={win} cur={cur} mode={mode} setMode={setMode} refresh={refresh} />
      <ExplorerToolbar win={win} mode={mode} setMode={setMode} back={back} fwd={fwd} up={up}
        searchPane={searchPane} toggleSearch={() => setSearchPane((v) => !v)} />
      <AddressBar cur={cur} address={address} go={go} />
      <div className="xp-split">
        {searchPane
          ? <SearchPane q={q} setQ={setQ} run={runSearch} done={win.search != null} count={items.length}
              back={() => { setSearchPane(false); if (win.search != null) navigate(win.id, stack, false); }} />
          : <TaskPane win={win} sel={sel} onSearch={() => setSearchPane(true)} />}
        <div
          key={`${cur}|${win.search ?? ''}|${mode}`}
          className={`files ${mode === 'tiles' ? 'tiles' : ''}`}
          data-drop={win.search == null ? cur : undefined}
          onMouseDown={() => setSel(null)}
          onContextMenu={(e) => { e.preventDefault(); if (win.search == null) openMenu(e, folderMenu(cur, refresh)); }}
        >
          <ItemView items={items} folder={cur} mode={mode} sel={sel} setSel={setSel} onOpen={open}
            onMenu={(e, id) => openMenu(e, itemMenu(id, win.id, stack))} sub={sub} />
        </div>
      </div>
      <div className="statusbar">
        <span>{items.length} objects</span>
        <span className="cell" style={{ marginLeft: 'auto' }}><NodeIcon node={s.fs.mycomp} size={16} />&nbsp;My Computer</span>
      </div>
    </div>
  );
}
