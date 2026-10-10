import { useEffect, useState } from 'react';
import { store, type State } from '../../engine/state';
import { isBeneath } from '../../engine/fs';
import { focusWin, minimizeWin, topWin } from '../../engine/windows';
import { openNode, openApp } from '../../engine/actions';
import { clockText } from '../../engine/clock';
import { sfx } from '../../engine/bus';
import { WinFlag, InfoIcon } from '../icons';
import { appIcon } from '../apps/registry';
import { openMenu } from '../Menu';
import { zoom, winRect, taskRect } from '../fx/zoom';

/**
 * The review software keeps count of what the reviewer has opened. The total includes the
 * records it has hidden, so the count never quite reaches the end on what Explorer shows.
 */
function viewedLabel(s: State): string {
  const records = Object.values(s.fs).filter((n) => n.kind !== 'folder' && n.parents.length && isBeneath(s.fs, n.id, 'carrow'));
  const opened = records.filter((n) => s.opened.includes(n.id)).length;
  return `Records opened: ${opened} of ${records.length}`;
}

export function Taskbar() {
  const s = store.s;
  const top = topWin();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 5000); return () => clearInterval(t); }, []);
  const b = s.balloons[0];
  return (
    <>
      <div className="taskbar">
        <div className={`startbtn ${store.ui.startOpen ? 'on' : ''}`} onMouseDown={(e) => { e.stopPropagation(); sfx('click'); store.ui.startOpen = !store.ui.startOpen; store.bump(); }}>
          <WinFlag size={20} /><span className="st">start</span>
        </div>
        <div className="tasks">
          {s.windows.filter((w) => w.app !== 'dialog' || w.bySystem).map((w) => (
            <div
              key={w.id}
              data-task={w.id}
              className={`task ${top?.id === w.id && !w.min ? 'on' : ''} ${w.notResponding ? 'hung' : ''}`}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (top?.id === w.id && !w.min) { zoom(winRect(w), taskRect(w.id)); minimizeWin(w.id); }
                else { if (w.min) zoom(taskRect(w.id), winRect(w)); focusWin(w.id); }
              }}
            >
              {appIcon(w, 16)}<span>{w.notResponding ? `${w.title} (Not Responding)` : w.title}</span>
            </div>
          ))}
        </div>
        <div className="tray">
          <span title="HRS Archive Assistant" className="hand" onClick={(e) => openMenu(e, [{ label: 'HRS Archive Assistant', bold: true, disabled: true }, { label: `Review: Carrow (${s.chapter >= 4 ? '435 / 435' : '412 / 412'})`, disabled: true }, { label: viewedLabel(s), disabled: true }])}>
            <InfoIcon size={16} type={s.chapter >= 3 ? 'warn' : 'info'} />
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 6h3l4-3.5v11L5 10H2z" fill="#e8eef8" stroke="#1d3c7a" strokeWidth="0.8" strokeLinejoin="round" />
            <path d="M11 5.2c1.4 1.5 1.4 4.1 0 5.6M12.8 3.8c2.2 2.3 2.2 6.1 0 8.4" stroke="#fff" fill="none" strokeLinecap="round" />
          </svg>
          <span className="clock">{clockText()}</span>
        </div>
      </div>
      {b && (
        <div key={b.id} className={`balloon ${b.leak ? 'leak' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
          <div className="x" onClick={() => { s.balloons = []; store.bump(); }}>
            <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.6" /></svg>
          </div>
          <h4><InfoIcon size={16} type="info" />{b.title}</h4>
          <div className="hand" onClick={() => { s.balloons = []; if (b.open) { if (b.open.startsWith('app:')) openApp(b.open); else openNode(b.open); } store.bump(); }}>{b.text}</div>
        </div>
      )}
    </>
  );
}
