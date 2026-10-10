import { useState } from 'react';
import { store } from '../../engine/state';
import { closeWin, dialog } from '../../engine/windows';
import { emit, sfx } from '../../engine/bus';
import { resolvePath } from '../../engine/fs';
import { openNode, openApp } from '../../engine/actions';
import type { Win } from '../../engine/types';
import { InfoIcon, WinFlag } from '../icons';
import { BRAND } from '../../brand';
import { Check } from './Properties';
import { Group } from './widgets';

const Radio = ({ on, label, set }: { on: boolean; label: string; set: () => void }) => (
  <div className="check radio" onClick={set}><span className="box">{on ? '●' : ''}</span>{label}</div>
);

export function Dialog({ win }: { win: Win }) {
  const d = win.dialog!;
  const press = (b: string) => {
    sfx('click');
    closeWin(win.id);
    if (d.action) emit({ t: 'action', id: d.action, button: b });
  };
  return (
    <>
      <div className="dlg-body">
        <InfoIcon type={d.icon ?? 'info'} />
        <div style={{ paddingTop: 2, maxWidth: 300 }} className="selectable">{d.text}</div>
      </div>
      <div className="dlg-btns">
        {(d.buttons ?? ['OK']).map((b, i) => <button key={b} className={`btn ${i === 0 ? 'default' : ''}`} onClick={() => press(b)}>{b}</button>)}
      </div>
    </>
  );
}

export function FolderOptions({ win }: { win: Win }) {
  const s = store.s;
  const [o, setO] = useState({ ...s.opts });
  const [warn, setWarn] = useState(false);
  const apply = () => {
    const was = s.opts.showHidden;
    s.opts = { ...o };
    store.bump();
    if (o.showHidden !== was) emit({ t: 'hidden', on: o.showHidden });
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: 8, position: 'relative' }}>
      {warn && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(236,233,216,0.7)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="win active" style={{ position: 'static', width: 340, boxShadow: '2px 2px 8px rgba(0,0,0,0.35)' }}>
            <div className="title"><span className="title-text">Warning</span></div>
            <div style={{ padding: '12px 12px 6px', display: 'flex', gap: 10, background: '#ece9d8' }}>
              <InfoIcon size={32} type="warn" />
              <div style={{ lineHeight: 1.35 }}>
                You have chosen to display protected operating system files: files marked both <b>System</b> and <b>Hidden</b>. Windows needs them to start and run, and changing or deleting them can stop the computer working.
                <br /><br />Are you sure you want to display these files?
              </div>
            </div>
            <div className="dlg-btns" style={{ background: '#ece9d8', paddingBottom: 10 }}>
              <button className="btn default" onClick={() => { setO({ ...o, showSystem: true }); setWarn(false); }}>Yes</button>
              <button className="btn" onClick={() => setWarn(false)}>No</button>
            </div>
          </div>
        </div>
      )}
      <div className="tabs"><div className="tab">General</div><div className="tab on">View</div><div className="tab">File Types</div></div>
      <div className="tabpage">
        <Group title="Advanced settings:">
          <Check on={o.hideExt} label="Hide extensions for known file types" onClick={() => setO({ ...o, hideExt: !o.hideExt })} />
          <Check on={!o.showSystem} label="Hide protected operating system files (Recommended)" onClick={() => (o.showSystem ? setO({ ...o, showSystem: false }) : setWarn(true))} />
          <div style={{ marginTop: 6 }}>Hidden files and folders</div>
          <div style={{ paddingLeft: 16 }}>
            <Radio on={!o.showHidden} label="Do not show hidden files and folders" set={() => setO({ ...o, showHidden: false })} />
            <Radio on={o.showHidden} label="Show hidden files and folders" set={() => setO({ ...o, showHidden: true })} />
          </div>
        </Group>
      </div>
      <div className="dlg-btns" style={{ justifyContent: 'flex-end', paddingBottom: 0 }}>
        <button className="btn default" onClick={() => { apply(); closeWin(win.id); }}>OK</button>
        <button className="btn" onClick={() => closeWin(win.id)}>Cancel</button>
        <button className="btn" onClick={apply}>Apply</button>
      </div>
    </div>
  );
}

const RUN_APPS: Record<string, string> = {
  cmd: 'app:cmd', 'cmd.exe': 'app:cmd', command: 'app:cmd', notepad: 'app:notepad', 'notepad.exe': 'app:notepad',
  eventvwr: 'app:events', 'eventvwr.msc': 'app:events', 'eventvwr.exe': 'app:events', taskmgr: 'app:taskmgr', 'taskmgr.exe': 'app:taskmgr',
  wordpad: 'app:wordpad', write: 'app:wordpad',
};

export function RunBox({ win }: { win: Win }) {
  const [v, setV] = useState('');
  const go = () => {
    const t = v.trim().toLowerCase();
    if (!t) return;
    closeWin(win.id);
    if (RUN_APPS[t]) { openApp(RUN_APPS[t]); return; }
    if (t === 'control') { openNode('control'); return; }
    const st = resolvePath(store.s.fs, v, store.s.fs.profile.name);
    if (st) { openNode(st[st.length - 1]); return; }
    dialog(v, `Windows cannot find '${v}'. Make sure you typed the name correctly, and then try again. To search for a file, click the Start button, and then click Search.`, 'error');
    sfx('error');
  };
  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 12 }}><WinFlag size={32} /><div>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</div></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        Open:
        <input className="field" style={{ flex: 1 }} autoFocus value={v} spellCheck={false}
          onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') go(); }} />
      </div>
      <div className="dlg-btns" style={{ justifyContent: 'flex-end', padding: 0 }}>
        <button className="btn default" onClick={go}>OK</button>
        <button className="btn" onClick={() => closeWin(win.id)}>Cancel</button>
      </div>
    </div>
  );
}

export function About({ win }: { win: Win }) {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 20, fontFamily: 'var(--ui)' }}><WinFlag size={36} /><b>{BRAND.osFull}</b></div>
      <div className="hr" />
      <div>Version 5.1 (Build 2600.xpsp_sp2_gdr)<br />{BRAND.copyright}</div>
      <div>This product is licensed to:<br /><b>{store.s.fullName}</b><br />{BRAND.computerName}</div>
      <div style={{ color: '#777' }}>This is a fictional operating system in a game. It is not affiliated with or endorsed by {BRAND.vendor}.</div>
      <div className="dlg-btns" style={{ justifyContent: 'flex-end', padding: 0 }}><button className="btn default" onClick={() => closeWin(win.id)}>OK</button></div>
    </div>
  );
}
