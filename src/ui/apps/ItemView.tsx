import { useEffect, useRef, useState } from 'react';
import { store } from '../../engine/state';
import { renameNode } from '../../engine/actions';
import { displayName, typeName, sizeLabel, isContainer } from '../../engine/fs';
import type { FNode, NodeId } from '../../engine/types';
import { NodeIcon } from '../icons';
import { renameReq } from './fileMenu';
import { armDrag, drag } from './drag';

interface Props {
  items: FNode[];
  folder: NodeId;
  mode: 'tiles' | 'details';
  sel: NodeId | null;
  setSel: (id: NodeId | null) => void;
  onOpen: (id: NodeId) => void;
  onMenu: (e: React.MouseEvent, id: NodeId) => void;
  sub?: (n: FNode) => string;
}

function RenameBox({ node, onDone }: { node: FNode; onDone: () => void }) {
  const showExt = !store.s.opts.hideExt;
  const [v, setV] = useState(displayName(node, showExt));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  const commit = () => { renameNode(node.id, v); onDone(); };
  return (
    <input
      ref={ref} className="nm edit" value={v} spellCheck={false}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') commit(); if (e.key === 'Escape') onDone(); }}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );
}

export function ItemView({ items, folder, mode, sel, setSel, onOpen, onMenu, sub }: Props) {
  const s = store.s;
  const showExt = !s.opts.hideExt;
  const [editing, setEditing] = useState<NodeId | null>(null);
  useEffect(() => {
    if (renameReq.id && items.some((i) => i.id === renameReq.id)) { setEditing(renameReq.id); setSel(renameReq.id); renameReq.id = null; }
  });
  const common = (n: FNode) => ({
    onMouseDown: (e: React.MouseEvent) => { e.stopPropagation(); setSel(n.id); if (editing !== n.id) armDrag(e, n.id, folder); },
    onDoubleClick: (e: React.MouseEvent) => { e.stopPropagation(); if (editing !== n.id) onOpen(n.id); },
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setSel(n.id); onMenu(e, n.id); },
    'data-drop': isContainer(n) ? n.id : undefined,
    'data-node': n.id,
  });
  const isDrop = (n: FNode) => drag.active && drag.id !== n.id && isContainer(n);
  const label = (n: FNode) => editing === n.id
    ? <RenameBox node={n} onDone={() => setEditing(null)} />
    : <span className="nm">{displayName(n, showExt)}</span>;

  if (!items.length) return <div className="empty-note">{sub ? 'Search is complete. There are no results to display.' : folder === 'bin' ? '' : 'This folder is empty.'}</div>;

  if (mode === 'details') {
    return (
      <table className="listview">
        <thead><tr><th style={{ width: '42%' }}>Name</th><th>Size</th><th>Type</th><th>Date Modified</th></tr></thead>
        <tbody>
          {items.map((n) => (
            <tr key={n.id} {...common(n)} className={`${sel === n.id ? 'sel' : ''} ${n.hidden ? 'hiddenf' : ''} ${isDrop(n) ? 'drop' : ''}`}>
              <td><NodeIcon node={n} size={16} />{label(n)}</td>
              <td style={{ textAlign: 'right' }}>{sizeLabel(n)}</td>
              <td>{typeName(n)}</td>
              <td>{n.modified}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <>
      {items.map((n) => (
        <div key={n.id} {...common(n)} className={`tile ${sel === n.id ? 'sel' : ''} ${n.hidden ? 'hiddenf' : ''} ${isDrop(n) ? 'drop' : ''}`}>
          <NodeIcon node={n} size={40} />
          <div className="meta">
            {label(n)}
            <span className="sub">{sub ? sub(n) : typeName(n)}</span>
            {!isContainer(n) && !sub && <span className="sub">{sizeLabel(n)}</span>}
          </div>
        </div>
      ))}
    </>
  );
}
