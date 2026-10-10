import { useState } from 'react';
import { store } from '../../engine/state';
import { openApp, newNode } from '../../engine/actions';
import { closeWin } from '../../engine/windows';
import type { NodeId, Win } from '../../engine/types';
import { NodeIcon } from '../icons';
import { openMenu } from '../Menu';
import { beginRename } from './fileMenu';

/** Glossy round navigation button (original art). */
const Arrow = ({ dir, on }: { dir: 'l' | 'r'; on: boolean }) => {
  const id = `nav${dir}${on ? 1 : 0}`;
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" style={{ filter: on ? undefined : 'grayscale(1) opacity(0.5)' }}>
      <defs>
        <radialGradient id={id} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#8fe08a" /><stop offset="0.55" stopColor="#3ea83a" /><stop offset="1" stopColor="#1f7a1d" />
        </radialGradient>
      </defs>
      <circle cx="13" cy="13" r="11.5" fill={`url(#${id})`} stroke="#1c6a1a" strokeWidth="0.8" />
      <ellipse cx="13" cy="8" rx="7.5" ry="4" fill="rgba(255,255,255,0.35)" />
      <path d={dir === 'l' ? 'M14.5 7.5L9 13l5.5 5.5M9.5 13h8' : 'M11.5 7.5L17 13l-5.5 5.5M8.5 13h8'} stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
const UpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M2 6h7l2 2h11v13H2z" fill="#f2cd5c" stroke="#b78a2c" />
    <path d="M2 10h20v11H2z" fill="#fbe49a" stroke="#b78a2c" />
    <path d="M12 19v-7M8.5 15l3.5-3.5 3.5 3.5" stroke="#2d8a2d" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const FoldersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22">
    <path d="M6 4h5l1.5 1.5H20V15H6z" fill="#f2cd5c" stroke="#b78a2c" />
    <path d="M2 9h5l1.5 1.5H16V20H2z" fill="#fbe49a" stroke="#b78a2c" />
  </svg>
);

interface Props {
  win: Win;
  cur: NodeId;
  mode: 'tiles' | 'details';
  setMode: (m: 'tiles' | 'details') => void;
  refresh: () => void;
  back: () => void;
  fwd: () => void;
  up: () => void;
  searchPane: boolean;
  toggleSearch: () => void;
}

export function ExplorerMenuBar({ win, cur, mode, setMode, refresh }: Pick<Props, 'win' | 'cur' | 'mode' | 'setMode' | 'refresh'>) {
  const ro = cur === 'mycomp' || cur === 'control' || win.search != null;
  return (
    <div className="menubar">
      <span className="mi" onClick={(e) => openMenu(e, [
        { label: 'New', disabled: ro, sub: [
          { label: 'Folder', run: () => beginRename(newNode(cur, 'folder')) },
          { label: 'Text Document', run: () => beginRename(newNode(cur, 'txt')) },
        ] },
        { sep: true },
        { label: 'Close', run: () => closeWin(win.id) },
      ])}>File</span>
      <span className="mi" onClick={(e) => openMenu(e, [{ label: 'Undo', disabled: true }, { sep: true }, { label: 'Select All', disabled: true }])}>Edit</span>
      <span className="mi" onClick={(e) => openMenu(e, [
        { label: 'Tiles', checked: mode === 'tiles', run: () => setMode('tiles') },
        { label: 'Details', checked: mode === 'details', run: () => setMode('details') },
        { sep: true },
        { label: 'Refresh', run: refresh },
      ])}>View</span>
      <span className="mi" onClick={(e) => openMenu(e, [{ label: 'Add to Favorites...', disabled: true }])}>Favorites</span>
      <span className="mi" onClick={(e) => openMenu(e, [
        { label: 'Map Network Drive...', disabled: true },
        { sep: true },
        { label: 'Folder Options...', run: () => openApp('app:folderopts') },
      ])}>Tools</span>
      <span className="mi" onClick={(e) => openMenu(e, [{ label: 'About Windows', run: () => openApp('app:about', { title: 'About Windows' }) }])}>Help</span>
    </div>
  );
}

export function ExplorerToolbar({ win, mode, setMode, back, fwd, up, searchPane, toggleSearch }: Omit<Props, 'cur' | 'refresh'>) {
  const hasBack = !!(win.back ?? []).length, hasFwd = !!(win.fwd ?? []).length;
  return (
    <div className="toolbar">
      <div className={`tb ${hasBack ? '' : 'dis'}`} onClick={back}><Arrow dir="l" on={hasBack} /> Back</div>
      <div className={`tb ${hasFwd ? '' : 'dis'}`} onClick={fwd}><Arrow dir="r" on={hasFwd} /></div>
      <div className="tb" onClick={up}><UpIcon /></div>
      <div className="tb-sep" />
      <div className={`tb ${searchPane ? 'on' : ''}`} onClick={toggleSearch}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="10" cy="10" r="6.5" fill="rgba(210,240,255,0.85)" stroke="#3d5a80" strokeWidth="2" />
          <path d="M7 8a3.5 3.5 0 0 1 3-2.5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M15 15l6 6" stroke="#7a4d1f" strokeWidth="3.2" strokeLinecap="round" />
        </svg> Search
      </div>
      <div className="tb" onClick={() => { if (searchPane) toggleSearch(); }}><FoldersIcon /> Folders</div>
      <div className="tb-sep" />
      <div className="tb views" onClick={() => setMode(mode === 'tiles' ? 'details' : 'tiles')}>
        <svg width="22" height="22" viewBox="0 0 22 22">
          <rect x="2" y="3" width="8" height="7" fill="#fff" stroke="#4a6ea8" /><rect x="12" y="3" width="8" height="7" fill="#fff" stroke="#4a6ea8" />
          <rect x="2" y="12" width="8" height="7" fill="#fff" stroke="#4a6ea8" /><rect x="12" y="12" width="8" height="7" fill="#fff" stroke="#4a6ea8" />
          <rect x="3.5" y="4.5" width="5" height="4" fill="#7fb0e8" /><rect x="13.5" y="13.5" width="5" height="4" fill="#f2cd5c" />
        </svg>
        <svg width="7" height="4" viewBox="0 0 7 4"><path d="M0 0h7L3.5 4z" fill="#000" /></svg>
      </div>
    </div>
  );
}

export function AddressBar({ cur, address, go }: { cur: NodeId; address: string; go: (t: string) => void }) {
  const [addr, setAddr] = useState<string | null>(null);
  return (
    <div className="addrbar">
      <span className="lab">Address</span>
      <div className="addr">
        <NodeIcon node={store.s.fs[cur]} size={16} />
        <input
          value={addr ?? address}
          onChange={(e) => setAddr(e.target.value)}
          onFocus={(e) => { setAddr(address); const t = e.target; setTimeout(() => t.select(), 0); }}
          onBlur={() => setAddr(null)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value; setAddr(null); (e.target as HTMLInputElement).blur(); go(v); }
            if (e.key === 'Escape') setAddr(null);
          }}
          spellCheck={false}
        />
        <span className="drop"><svg width="7" height="4" viewBox="0 0 7 4"><path d="M0 0h7L3.5 4z" fill="#4d6185" /></svg></span>
      </div>
      <div className="go" onMouseDown={(e) => e.preventDefault()} onClick={() => go(addr ?? address)}>
        <svg width="18" height="18" viewBox="0 0 18 18"><rect x="1" y="1" width="16" height="16" rx="3" fill="#3c9a3c" /><path d="M5 9h7M9 5l4 4-4 4" stroke="#fff" strokeWidth="2" fill="none" /></svg>Go
      </div>
    </div>
  );
}

/** Original search-companion mascot: a small pixel dog. */
export function Dog() {
  return (
    <svg width="64" height="56" viewBox="0 0 32 28">
      <path d="M6 18h16v6H6z M20 12h7v7h-7z" fill="#d9a35b" />
      <path d="M25 11l3-3v6z" fill="#8a5a2b" />
      <rect x="23" y="14" width="2" height="2" fill="#000" />
      <rect x="27" y="16" width="2" height="1.5" fill="#000" />
      <path d="M6 24h3v3H6z M18 24h3v3h-3z" fill="#8a5a2b" />
      <path d="M6 18l-4-3" stroke="#8a5a2b" strokeWidth="2" />
    </svg>
  );
}
