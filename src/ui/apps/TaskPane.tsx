import { useState } from 'react';
import { store } from '../../engine/state';
import { openNode, newNode, deleteNode, showProps, emptyBin } from '../../engine/actions';
import { displayName, typeName, sizeLabel, isContainer } from '../../engine/fs';
import type { NodeId, Win } from '../../engine/types';
import { NodeIcon } from '../icons';
import { beginRename } from './fileMenu';
import { thumb } from '../art/render';

const Link = ({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) => (
  <div className="tp-link" onClick={onClick}>{icon}<span>{children}</span></div>
);

/** Collapsible task-pane group with the round chevron button. */
function Box({ title, children, special }: { title: string; children: React.ReactNode; special?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`tp-box ${special ? 'special' : ''} ${open ? '' : 'shut'}`}>
      <div className="tp-head hand" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className="tp-chev">
          <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: open ? undefined : 'rotate(180deg)' }}>
            <path d="M1 4.5l3.5-3 3.5 3M1 8l3.5-3 3.5 3" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        </span>
      </div>
      <div className="tp-body-wrap"><div className="tp-body">{children}</div></div>
    </div>
  );
}

export function TaskPane({ win, sel, onSearch }: { win: Win; sel: NodeId | null; onSearch: () => void }) {
  const s = store.s;
  const cur = win.path?.[win.path.length - 1] ?? 'desktop';
  const folder = s.fs[cur];
  const node = sel ? s.fs[sel] : null;
  const showExt = !s.opts.hideExt;
  const go = (id: NodeId) => openNode(id, win.id);
  const suggestions = s.suggest.map((id) => s.fs[id]).filter((n) => n && n.parents.length && !n.parents.includes('bin'));
  const inCarrow = (win.path ?? []).includes('carrow');

  return (
    <div className="taskpane">
      {cur === 'bin' ? (
        <Box title="Recycle Bin Tasks">
          <Link onClick={() => emptyBin()}>Empty the Recycle Bin</Link>
        </Box>
      ) : (
        <Box title="File and Folder Tasks">
          {node ? (
            <>
              <Link onClick={() => beginRename(node.id)}>Rename this {isContainer(node) ? 'folder' : 'file'}</Link>
              <Link onClick={() => deleteNode(node.id)}>Delete this {isContainer(node) ? 'folder' : 'file'}</Link>
              <Link onClick={() => showProps(node.id)}>View properties</Link>
            </>
          ) : (
            <>
              <Link onClick={() => beginRename(newNode(cur, 'folder'))}>Make a new folder</Link>
              <Link onClick={onSearch}>Search for files or folders</Link>
            </>
          )}
        </Box>
      )}

      {inCarrow && suggestions.length > 0 && (
        <Box title="Archive Assistant" special>
          <div className="det" style={{ color: '#333' }}>Suggested for your review:</div>
          {suggestions.map((n) => (
            <Link key={n!.id} onClick={() => openNode(n!.id)} icon={<NodeIcon node={n!} size={16} />}>{displayName(n!, showExt)}</Link>
          ))}
        </Box>
      )}

      <Box title="Other Places">
        <Link onClick={() => go('desktop')} icon={<NodeIcon node={s.fs.desktop} size={16} />}>Desktop</Link>
        <Link onClick={() => go('mydocs')} icon={<NodeIcon node={s.fs.mydocs} size={16} />}>My Documents</Link>
        <Link onClick={() => go('mycomp')} icon={<NodeIcon node={s.fs.mycomp} size={16} />}>My Computer</Link>
        {inCarrow && <Link onClick={() => go('carrow')} icon={<NodeIcon node={s.fs.carrow} size={16} />}>Carrow</Link>}
      </Box>

      <Box title="Details">
        {node ? (
          <div className="det">
            {node.kind === 'img' && node.art && <img src={thumb(node.art, 140, 105)} width={140} height={105} style={{ display: 'block', marginBottom: 6, border: '1px solid #8aa' }} />}
            <b>{displayName(node, showExt)}</b>
            {typeName(node)}<br />
            {node.kind === 'img' && <>Dimensions: 640 x 480<br /></>}
            Date Modified: {node.modified}<br />
            {!isContainer(node) && <>Size: {sizeLabel(node)}<br /></>}
            {node.hidden && <>Attributes: Hidden<br /></>}
          </div>
        ) : (
          <div className="det"><b>{folder?.name}</b>{folder ? typeName(folder) : ''}<br />{folder?.modified && <>Date Modified: {folder.modified}</>}</div>
        )}
      </Box>
    </div>
  );
}
