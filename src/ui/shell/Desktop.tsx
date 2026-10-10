import { useEffect, useState } from 'react';
import { store, useStore } from '../../engine/state';
import { children, displayName } from '../../engine/fs';
import { openNode, renameNode } from '../../engine/actions';
import { topWin } from '../../engine/windows';
import type { FNode, NodeId } from '../../engine/types';
import { NodeIcon } from '../icons';
import { Window } from '../Window';
import { openMenu, MenuLayer } from '../Menu';
import { itemMenu, folderMenu, renameReq } from '../apps/fileMenu';
import { armDrag, drag } from '../apps/drag';
import { renderApp, appIcon, chromeFor } from '../apps/registry';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';
import { ShutdownPrompt } from './ShutdownPrompt';
import { wallpaperURL } from '../art/wallpaper';

const ORDER = ['mycomp', 'mydocs', 'bin', 'lnk_carrow', 'lnk_mail', 'lnk_review', 'notes'];

function DeskRename({ node, done }: { node: FNode; done: () => void }) {
  const [v, setV] = useState(displayName(node, !store.s.opts.hideExt));
  const commit = () => { renameNode(node.id, v); done(); };
  return (
    <input className="lbl edit" autoFocus value={v} spellCheck={false}
      onFocus={(e) => e.target.select()} onChange={(e) => setV(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') commit(); if (e.key === 'Escape') done(); }}
      onMouseDown={(e) => e.stopPropagation()} />
  );
}

function DesktopIcons() {
  const s = store.s;
  const [sel, setSel] = useState<NodeId | null>(null);
  const [editing, setEditing] = useState<NodeId | null>(null);
  const items = children(s.fs, 'desktop', { hidden: s.opts.showHidden, system: s.opts.showSystem })
    .sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99));
  useEffect(() => {
    if (renameReq.id && items.some((i) => i.id === renameReq.id) && !s.windows.some((w) => !w.min)) { setEditing(renameReq.id); renameReq.id = null; }
  });
  const perCol = 8;
  return (
    <div className="dicons" data-drop="desktop"
      onMouseDown={() => { setSel(null); store.ui.startOpen = false; store.bump(); }}
      onContextMenu={(e) => { e.preventDefault(); openMenu(e, folderMenu('desktop', () => store.bump())); }}>
      {items.map((n, i) => {
        const x = 8 + Math.floor(i / perCol) * 82, y = 8 + (i % perCol) * 84;
        return (
          <div key={n.id} className={`dicon ${sel === n.id ? 'sel' : ''} ${n.hidden ? 'hiddenf' : ''}`} style={{ left: x, top: y }}
            data-drop={['mydocs', 'bin'].includes(n.id) ? n.id : undefined}
            data-node={n.id}
            onMouseDown={(e) => { e.stopPropagation(); setSel(n.id); store.ui.startOpen = false; armDrag(e, n.id, 'desktop'); }}
            onDoubleClick={(e) => { e.stopPropagation(); openNode(n.id); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSel(n.id); openMenu(e, itemMenu(n.id)); }}>
            <NodeIcon node={n} size={32} />
            {editing === n.id ? <DeskRename node={n} done={() => setEditing(null)} /> : <span className="lbl">{displayName(n, !s.opts.hideExt)}</span>}
          </div>
        );
      })}
    </div>
  );
}

function DragGhost() {
  if (!drag.active || !drag.id) return null;
  const n = store.s.fs[drag.id];
  return (
    <div style={{ position: 'absolute', left: drag.x - 16, top: drag.y - 16, opacity: 0.6, pointerEvents: 'none', zIndex: 65000 }}>
      <NodeIcon node={n} size={32} />
    </div>
  );
}

export function Desktop() {
  const s = useStore();
  const top = topWin();
  const [arrive, setArrive] = useState(true);
  useEffect(() => { const t = setTimeout(() => setArrive(false), 900); return () => clearTimeout(t); }, []);
  return (
    <div className={`desktop ${arrive ? 'arrive' : ''}`} onMouseDown={() => { if (store.ui.startOpen) { store.ui.startOpen = false; store.bump(); } }}>
      <div className="wallpaper" style={{ background: `url(${wallpaperURL()}) center / cover` }} />
      <DesktopIcons />
      {s.windows.map((w) => {
        const c = chromeFor(w);
        return (
          <Window key={w.id} win={w} active={top?.id === w.id} icon={appIcon(w, 16)} {...c}>
            {renderApp(w)}
          </Window>
        );
      })}
      <DragGhost />
      <StartMenu />
      <Taskbar />
      <MenuLayer />
      <ShutdownPrompt />
    </div>
  );
}
