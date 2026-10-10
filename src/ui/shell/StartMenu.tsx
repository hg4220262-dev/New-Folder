import { store } from '../../engine/state';
import { openNode, openApp, openPath } from '../../engine/actions';
import { displayName } from '../../engine/fs';
import { dialog } from '../../engine/windows';
import { NodeIcon, ExeIcon, MailIcon, ControlIcon, InfoIcon, NotepadIcon, CmdIcon, WordPadIcon, RunIcon } from '../icons';
import { Avatar } from './Avatar';
import { logOff, turnOff } from '../screens/session';

export const PowerGlyph = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14"><path d="M4.2 3.6a4.6 4.6 0 1 0 5.6 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" /><path d="M7 1.5v5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
export const KeyGlyph = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14"><circle cx="4.5" cy="7" r="2.6" stroke="#fff" strokeWidth="1.6" fill="none" /><path d="M7 7h5.5M10.5 7v2.5M12.3 7v2" stroke="#fff" strokeWidth="1.6" /></svg>
);

export function StartMenu() {
  const s = store.s;
  if (!store.ui.startOpen) return null;
  const close = () => { store.ui.startOpen = false; store.bump(); };
  const act = (f: () => void) => () => { close(); f(); };
  const recent = s.recent.map((id) => s.fs[id]).filter((n) => n && n.parents.length).slice(0, 6);
  return (
    <div className="startmenu" onMouseDown={(e) => e.stopPropagation()}>
      <div className="sm-head"><div className="sm-avatar"><Avatar /></div>{s.flags.account === 'admin' ? 'Administrator' : s.shownUser}</div>
      <div className="sm-cols">
        <div className="sm-left">
          <div className="sm-item" onClick={act(() => openApp('app:ie'))}><ExeIcon size={28} /><div><b>Internet</b><br /><span style={{ color: '#666' }}>Internet Explorer</span></div></div>
          <div className="sm-item" onClick={act(() => openApp('app:mail'))}><MailIcon size={28} /><div><b>E-mail</b><br /><span style={{ color: '#666' }}>Mail</span></div></div>
          <div className="sm-item" onClick={act(() => openNode('carrow'))}><NodeIcon node={s.fs.carrow} size={28} /><div><b>Carrow Archive</b><br /><span style={{ color: '#666' }}>HRS review</span></div></div>
          <div className="sm-sep" />
          <div className="sm-item" onClick={act(() => openApp('app:notepad'))}><NotepadIcon size={24} />Notepad</div>
          <div className="sm-item" onClick={act(() => openApp('app:cmd'))}><CmdIcon size={24} />Command Prompt</div>
          <div className="sm-item" onClick={act(() => openApp('app:wordpad'))}><WordPadIcon size={24} />WordPad</div>
          <div style={{ flex: 1 }} />
          <div className="sm-sep" />
          <div className="sm-item sm-all" onClick={act(() => openPath(['mycomp', 'c', 'progfiles']))}>
            All Programs
            <span className="arr"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 1.5L7 5 3 8.5" stroke="#fff" strokeWidth="2" fill="none" /></svg></span>
          </div>
        </div>
        <div className="sm-right">
          <div className="sm-item" onClick={act(() => openNode('mydocs'))}><NodeIcon node={s.fs.mydocs} size={24} />My Documents</div>
          <div className="sm-item" onClick={act(() => openNode('mypics'))}><NodeIcon node={s.fs.mypics} size={24} />My Pictures</div>
          <div className="sm-item" onClick={act(() => openNode('mycomp'))}><NodeIcon node={s.fs.mycomp} size={24} />My Computer</div>
          {recent.length > 0 && (
            <>
              <div className="sm-sep" />
              <div className="sm-recent-h">My Recent Documents</div>
              {recent.map((n) => <div key={n!.id} className="sm-item light" onClick={act(() => openNode(n!.id))}><NodeIcon node={n!} size={16} />{displayName(n!, false).slice(0, 22)}</div>)}
            </>
          )}
          <div className="sm-sep" />
          <div className="sm-item light" onClick={act(() => openNode('control'))}><ControlIcon size={24} />Control Panel</div>
          <div className="sm-item light" onClick={act(() => dialog('Help and Support', 'Help and Support Center could not be started.\n\nThe service is not available on this computer.', 'info'))}><InfoIcon size={24} type="question" />Help and Support</div>
          <div className="sm-item light" onClick={act(() => openApp('app:run'))}><RunIcon size={24} />Run...</div>
        </div>
      </div>
      <div className="sm-foot">
        <div className="sm-item" onClick={act(logOff)}><span className="sm-pw logoff"><KeyGlyph /></span>Log Off</div>
        <div className="sm-item" onClick={act(turnOff)}><span className="sm-pw off"><PowerGlyph /></span>Turn Off Computer</div>
      </div>
    </div>
  );
}
