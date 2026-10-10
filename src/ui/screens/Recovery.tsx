import { useEffect, useRef, useState } from 'react';
import { store } from '../../engine/state';
import { sfx } from '../../engine/bus';
import { chooseEnding } from '../../story/climax';
import { MILL_ROW } from '../../story/people';
import { FolderIcon, InfoIcon, DocIcon } from '../icons';
import { floodedWallpaperURL } from '../art/wallpaper';
import { Glyph } from '../Window';
import { eraseEligible, eraseCount, eraseLocked, records, removeNext, serviceLine, TOTAL } from '../../story/erase';

/**
 * After the crash the computer comes back WITHOUT the 4:3 frame: the desktop is
 * the full width of the real screen. Four items remain: the ~unmatched folder and three choices. Nothing else.
 * In Safe Mode, with the service not running, the folder itself offers a fourth: removing the 23 by hand.
 */
export function Recovery() {
  const s = store.s;
  const [open, setOpen] = useState<null | 'folder' | 'confirm'>(null);
  const [choice, setChoice] = useState<null | 'signoff' | 'restore' | 'leave'>(null);
  const [wp, setWp] = useState('');
  const [typed, setTyped] = useState('');
  const [bad, setBad] = useState(false);
  const [, force] = useState(0);
  const logEnd = useRef<HTMLDivElement>(null);
  const eligible = eraseEligible(s), n = eraseCount(s), locked = eraseLocked(s), recs = records(s);
  useEffect(() => { setTimeout(() => setWp(floodedWallpaperURL()), 50); sfx('logon'); if (locked) setOpen('folder'); }, []);
  useEffect(() => { logEnd.current?.scrollIntoView(); }, [n]);
  const names = MILL_ROW.map((p) => `${p.forename === '(infant)' ? s.user : p.forename} ${p.surname}`);

  const pick = (c: 'signoff' | 'restore' | 'leave') => { if (locked) return; setChoice(c); setOpen('confirm'); };
  const remove = () => {
    const r = removeNext(typed);
    setBad(!r.ok);
    if (r.ok) setTyped('');
    force((x) => x + 1);
  };
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
        <div className="dicon hand" style={{ position: 'static' }} onDoubleClick={() => setOpen('folder')}><FolderIcon size={32} /><span className="lbl">~unmatched ({TOTAL - n})</span></div>
        <div className="dicon hand" style={{ position: 'static' }} onDoubleClick={() => pick('signoff')}><InfoIcon size={32} type="question" /><span className="lbl">Close Archive Review</span></div>
        <div className="dicon hand" style={{ position: 'static' }} onDoubleClick={() => pick('restore')}><DocIcon size={32} kind="doc" /><span className="lbl">Restore Records</span></div>
        <div className="dicon hand" style={{ position: 'static' }} onDoubleClick={() => pick('leave')}><DocIcon size={32} /><span className="lbl">notes.txt</span></div>
      </div>
      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
        Double-click an item. There is no rush.
      </div>
      {open === 'folder' && (
        <div className="win" style={{ left: '50%', top: '18%', width: 460, transform: 'translateX(-50%)', zIndex: 10 }}>
          <div className="title"><span className="title-text">~unmatched</span>{!locked && <div className="tbtn close" onClick={() => setOpen(null)}><Glyph k="close" /></div>}</div>
          <div className="win-body" style={{ background: '#fff', padding: 10, maxHeight: 250, overflow: 'auto', columns: 2, lineHeight: '19px' }}>
            {names.map((nm, i) => <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', ...(i < n ? { color: '#999', textDecoration: 'line-through' } : {}) }}><DocIcon size={16} />{nm}</div>)}
          </div>
          {eligible && (
            <div className="erase-pane">
              <div className="erase-head">HRS Continuity Service: not running (Safe Mode)</div>
              {n > 0 && <div className="erase-log">{Array.from({ length: n }, (_, i) => <div key={i}>{serviceLine(i + 1, s)}</div>)}<div ref={logEnd} /></div>}
              {n < TOTAL && (
                <div className="erase-prompt">
                  <div>Remove {recs[n].file}? Type the name on the record to confirm.</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input className="field" style={{ width: 220 }} value={typed} spellCheck={false} autoFocus
                      onChange={(e) => { setTyped(e.target.value); setBad(false); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') remove(); }} />
                    <button className="btn default" onClick={remove}>Remove</button>
                    {!locked && <button className="btn" onClick={() => setOpen(null)}>Cancel</button>}
                  </div>
                  {bad && <div style={{ color: '#a00' }}>The name typed does not match the record.</div>}
                  {locked && <div style={{ color: '#666' }}>This operation can no longer be cancelled.</div>}
                </div>
              )}
            </div>
          )}
          <div className="statusbar">{TOTAL - n} objects</div>
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
