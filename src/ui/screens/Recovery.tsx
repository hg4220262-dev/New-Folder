import { useEffect, useState } from 'react';
import { store } from '../../engine/state';
import { sfx } from '../../engine/bus';
import { chooseEnding } from '../../story/climax';
import { MILL_ROW } from '../../story/people';
import { FolderIcon, InfoIcon, DocIcon } from '../icons';
import { floodedWallpaperURL } from '../art/wallpaper';
import { Glyph } from '../Window';

/**
 * After the crash the computer comes back WITHOUT the 4:3 frame: the desktop is
 * the full width of the real screen. Four items remain: the ~unmatched folder and three choices. Nothing else.
 */
export function Recovery() {
  const s = store.s;
  const [open, setOpen] = useState<null | 'folder' | 'confirm'>(null);
  const [choice, setChoice] = useState<null | 'signoff' | 'restore' | 'leave'>(null);
  const [wp, setWp] = useState('');
  useEffect(() => { setTimeout(() => setWp(floodedWallpaperURL()), 50); sfx('logon'); }, []);
  const names = MILL_ROW.map((p) => `${p.forename === '(infant)' ? s.user : p.forename} ${p.surname}`);

  const pick = (c: 'signoff' | 'restore' | 'leave') => { setChoice(c); setOpen('confirm'); };
  const confirm = () => { sfx('click'); chooseEnding(choice!); };

  const text: Record<string, string> = {
    signoff: 'Sign off the review. The archive will record 412 / 412. Unmatched records (23) will be removed. The paper originals will be destroyed.',
    restore: 'Restore all records. The archive will record 435 residents, 412 rehoused, and 23 not accounted for. The Certificate will be marked as disputed. The Continuity Service will stop.',
    leave: 'Leave the review open. Nothing will be signed. Nothing will be removed. The Continuity Service will keep running on this computer.',
  };

  return (
    <div className="screen" style={{ background: wp ? `url(${wp}) center / cover` : '#1c2a3a', fontFamily: 'var(--ui)' }}>
      <div style={{ position: 'absolute', top: 8, right: 14, color: '#fff', fontSize: 18, fontFamily: 'var(--mono)', opacity: 0.85 }}>
        {s.safeMode ? 'Safe Mode' : 'Recovery'}
      </div>
      <div style={{ position: 'absolute', left: 14, top: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="dicon hand" style={{ position: 'static' }} onDoubleClick={() => setOpen('folder')}><FolderIcon size={32} /><span className="lbl">~unmatched (23)</span></div>
        <div className="dicon hand" style={{ position: 'static' }} onDoubleClick={() => pick('signoff')}><InfoIcon size={32} type="question" /><span className="lbl">Close Archive Review</span></div>
        <div className="dicon hand" style={{ position: 'static' }} onDoubleClick={() => pick('restore')}><DocIcon size={32} kind="doc" /><span className="lbl">Restore Records</span></div>
        <div className="dicon hand" style={{ position: 'static' }} onDoubleClick={() => pick('leave')}><DocIcon size={32} /><span className="lbl">notes.txt</span></div>
      </div>
      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
        Double-click an item. There is no rush.
      </div>
      {open === 'folder' && (
        <div className="win" style={{ left: '50%', top: '18%', width: 460, transform: 'translateX(-50%)', zIndex: 10 }}>
          <div className="title"><span className="title-text">~unmatched</span><div className="tbtn close" onClick={() => setOpen(null)}><Glyph k="close" /></div></div>
          <div className="win-body" style={{ background: '#fff', padding: 10, maxHeight: 360, overflow: 'auto', columns: 2, lineHeight: '19px' }}>
            {names.map((n, i) => <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><DocIcon size={16} />{n}</div>)}
          </div>
          <div className="statusbar">23 objects</div>
        </div>
      )}
      {open === 'confirm' && choice && (
        <div className="win" style={{ left: '50%', top: '30%', width: 420, transform: 'translateX(-50%)', zIndex: 11 }}>
          <div className="title"><span className="title-text">{choice === 'leave' ? 'notes.txt' : choice === 'restore' ? 'Restore Records' : 'Close Archive Review'}</span><div className="tbtn close" onClick={() => setOpen(null)}><Glyph k="close" /></div></div>
          <div className="win-body">
            {choice === 'leave' && <div style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 17, whiteSpace: 'pre-wrap', background: '#fff' }}>{`Fri - \n\n  (you can leave this open.)`}</div>}
            <div className="dlg-body"><InfoIcon type="question" /><div style={{ maxWidth: 320 }}>{text[choice]}</div></div>
            <div className="dlg-btns"><button className="btn default" onClick={confirm}>{choice === 'leave' ? 'Leave it open' : choice === 'restore' ? 'Restore' : 'Sign Off'}</button><button className="btn" onClick={() => setOpen(null)}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
