import { useState } from 'react';
import { store, SLOTS, ALL_ENDINGS, seenEndings, type Slot, type SlotInfo } from '../../engine/state';
import { sfx } from '../../engine/bus';
import { FolderIcon } from '../icons';
import { newGame, continueGame } from './session';
import { Settings } from './Settings';

const fmtTime = (ms: number) => {
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};
const fmtDate = (t: number) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

type Mode = { k: 'list' } | { k: 'confirm-new'; slot: Slot } | { k: 'erase'; slot: Slot } | { k: 'copy'; from: Slot };

function FileSelect({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>({ k: 'list' });
  const [, force] = useState(0);
  const info = SLOTS.map((n) => store.slotInfo(n));
  const start = (slot: Slot) => { sfx('startup'); newGame(slot); };
  const open = (slot: Slot, i: SlotInfo | null) => {
    if (mode.k === 'copy') {
      if (slot === mode.from) { setMode({ k: 'list' }); return; }
      if (i) return; // copies only go into empty files
      store.copySave(mode.from, slot); sfx('click'); setMode({ k: 'list' }); return;
    }
    if (!i) { start(slot); return; }
    sfx('startup'); continueGame(slot);
  };
  const empty = info.some((i) => !i);
  return (
    <div className="file-select">
      <h2>{mode.k === 'copy' ? `Copy File ${mode.from + 1} to which file?` : 'Choose a file'}</h2>
      {SLOTS.map((n) => {
        const i = info[n];
        const dim = mode.k === 'copy' && !!i && n !== mode.from;
        return (
          <div key={n} className={`file ${i ? '' : 'empty'} ${dim ? 'dim' : ''} ${store.slot === n && i ? 'last' : ''}`}>
            <div className="hand file-main" onClick={() => open(n, i)}>
              <span className="file-no">FILE {n + 1}</span>
              <FolderIcon size={30} open={!!i} />
              {i ? (
                <span className="file-meta">
                  <b>{i.user}</b>
                  <span>{i.ending ? `Complete: ${ALL_ENDINGS.find(([id]) => id === i.ending)?.[1] ?? 'Closed'}` : `Chapter ${i.chapter}`}</span>
                  <span className="file-sub">{fmtTime(i.playMs)} played{i.savedAt ? ` \u00b7 ${fmtDate(i.savedAt)}` : ''}</span>
                </span>
              ) : <span className="file-meta"><b>New Folder</b><span className="file-sub">Empty</span></span>}
            </div>
            {mode.k === 'list' && i && (
              <div className="file-acts">
                <span className="hand" onClick={() => setMode({ k: 'confirm-new', slot: n })}>Start over</span>
                {empty && <span className="hand" onClick={() => setMode({ k: 'copy', from: n })}>Copy</span>}
                <span className="hand" onClick={() => setMode({ k: 'erase', slot: n })}>Erase</span>
              </div>
            )}
            {(mode.k === 'erase' || mode.k === 'confirm-new') && mode.slot === n && (
              <div className="file-acts confirm">
                <span>{mode.k === 'erase' ? 'Erase this file?' : 'Start over? This file will be replaced.'}</span>
                <span className="hand" onClick={() => {
                  if (mode.k === 'erase') { store.clearSave(n); sfx('recycle'); setMode({ k: 'list' }); force((x) => x + 1); }
                  else start(n);
                }}>Yes</span>
                <span className="hand" onClick={() => setMode({ k: 'list' })}>No</span>
              </div>
            )}
          </div>
        );
      })}
      <div className="opt hand" onClick={() => (mode.k === 'list' ? onBack() : setMode({ k: 'list' }))}>{mode.k === 'list' ? 'Back' : 'Cancel'}</div>
    </div>
  );
}

/** The endings reached so far: names for the ones found, only a count for the rest. */
function EndingsFound() {
  const seen = seenEndings();
  if (!seen.length) return null;
  const names = ALL_ENDINGS.filter(([id]) => seen.includes(id)).map(([, n]) => n);
  return (
    <div className="endings-found">
      Endings found: {seen.length} of {ALL_ENDINGS.length}
      <div>{names.join('  \u00b7  ')}</div>
    </div>
  );
}

export function Title() {
  const [view, setView] = useState<'main' | 'settings' | 'files'>('main');
  if (view === 'settings') return <div className="screen title-screen"><Settings onClose={() => setView('main')} /></div>;
  return (
    <div className="screen title-screen">
      <div className="folder-mark"><FolderIcon size={72} /></div>
      <h1>New Folder</h1>
      {view === 'files' ? <FileSelect onBack={() => setView('main')} /> : (
        <div className="menu-v">
          <div className="opt hand" onClick={() => setView('files')}>Switch it on</div>
          <div className="opt hand" onClick={() => setView('settings')}>Settings</div>
          <div className="opt hand" onClick={() => window.host?.quit()}>Quit</div>
        </div>
      )}
      <EndingsFound />
      <div className="warn">
        Contains flashing images, screen shake and simulated system failures. These are on-screen effects only: your own files are never read, changed or deleted.
        <br />Reduce flashing and reduce motion are in Settings. Press Esc at any time to pause. {'\u2318'}Q quits.
      </div>
    </div>
  );
}
