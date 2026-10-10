import { useEffect, useState } from 'react';
import { store, useStore } from '../../engine/state';
import { PowerGlyph } from '../shell/StartMenu';
import { sfx } from '../../engine/bus';
import { BRAND } from '../../brand';
import { WinFlag } from '../icons';
import { Avatar } from '../shell/Avatar';
import { enterDesktop } from './session';
import { session } from '../../engine/fs';
import { ADMIN_PASSWORD } from '../../story/world_admin';

const POST = [
  `${BRAND.biosVendor}, An Energy Star Ally`,
  'Copyright (C) 1984-2004, Phoenix-like Technologies, LTD',
  '',
  'LAPTOP-0411 BIOS Rev. A07',
  '',
  'Main Processor : Mobile Intel(R) Celeron(R) CPU 1.60GHz',
  'Memory Testing : 1048576K OK',
  '',
  'Primary Master  : HTS541040G9AT00  40.0 GB',
  'Primary Slave   : None',
  'Secondary Master: CD-RW/DVD-ROM',
  '',
  'Press F2 to enter SETUP, F12 for Boot Menu',
];

/** BIOS text, then the boot logo with the moving progress bar. */
export function Boot() {
  const [stage, setStage] = useState<'post' | 'black' | 'logo' | 'fade'>('post');
  const [lines, setLines] = useState(0);
  const [mem, setMem] = useState(0);
  useEffect(() => {
    if (stage !== 'post') return;
    if (lines >= POST.length) { const t = setTimeout(() => setStage('black'), 1100); return () => clearTimeout(t); }
    // The memory test counts up before the rest of the POST appears.
    if (lines === 6 && mem < 1048576) {
      const t = setTimeout(() => setMem((m) => Math.min(1048576, m + 65536)), 28);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setLines((l) => l + 1); if (lines === 6) sfx('beep'); }, lines === 6 ? 260 : lines < 4 ? 140 : 70);
    return () => clearTimeout(t);
  }, [stage, lines, mem]);
  useEffect(() => {
    if (stage === 'black') { const t = setTimeout(() => setStage('logo'), 700); return () => clearTimeout(t); }
    if (stage === 'logo') {
      sfx('hddseek');
      const seek = setInterval(() => { if (Math.random() < 0.6) sfx('hddseek'); }, 900);
      const t = setTimeout(() => setStage('fade'), 4300);
      return () => { clearInterval(seek); clearTimeout(t); };
    }
    if (stage === 'fade') { const t = setTimeout(() => { store.s.phase = 'login'; store.bump(); }, 600); return () => clearTimeout(t); }
  }, [stage]);
  if (stage === 'post') {
    const shown = POST.slice(0, lines).map((l, i) => (i === 6 ? `Memory Testing : ${mem}K OK` : l));
    if (lines === 6) shown.push(`Memory Testing : ${mem}K`);
    return (
      <div className="screen post">
        <div className="energy" />
        {shown.join('\n')}
        {lines < POST.length && <span className="post-caret" />}
      </div>
    );
  }
  if (stage === 'black') return <div className="screen" style={{ background: '#000' }} />;
  return (
    <div className={`screen bootlogo ${stage === 'fade' ? 'fade' : ''}`}>
      <div className="wordmark">
        <WinFlag size={72} />
        <span className="wm-text">
          <small>{BRAND.vendor}<sup>®</sup></small>
          {BRAND.osName}<sup className="ed">{BRAND.osEdition}</sup>
        </span>
      </div>
      <div className="bootbar"><div className="run">{[0, 1, 2].map((i) => <i key={i} />)}</div></div>
      <div className="copy"><span>{BRAND.copyright} {BRAND.vendor} Corporation</span><span className="vendor">{BRAND.vendor}<sup>®</sup></span></div>
    </div>
  );
}

/** The Welcome screen. Click your name to log on. */
export function Login() {
  const s = useStore();
  const [step, setStep] = useState(0);
  const status = store.ui.loginStatus;
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const go = (acct: 'user' | 'admin' = 'user') => {
    if (step || status) return;
    sfx('click');
    store.s.flags.account = acct;
    if (acct === 'admin') store.s.flags.adminEver = true;
    session.admin = acct === 'admin';
    setStep(1);
    store.s.busy = true;
    setTimeout(() => setStep(2), 900);
    setTimeout(() => setStep(3), 1900);
    setTimeout(() => { store.s.busy = false; enterDesktop(); }, 2700);
  };
  const tryPw = () => { if (pw.toLowerCase() === ADMIN_PASSWORD) go('admin'); else { setPwErr('The password is incorrect. Check that you typed it correctly.'); setPw(''); } };
  const busyText = step === 1 ? 'welcome' : step === 2 ? 'Loading your personal settings...' : step === 3 ? 'Applying your personal settings...' : null;
  const centre = status ?? busyText;
  return (
    <div className={`screen welcome ${centre ? 'busy' : ''}`}>
      <div className="band-top" />
      <div className="mid">
        <div className="left">
          <div className="wm-row">
            <WinFlag size={centre ? 64 : 50} />
            <span className="wm">{BRAND.osName}<sup>{BRAND.osEdition}</sup></span>
          </div>
          {!centre && <div className="hint">To begin, click your user name</div>}
        </div>
        <div className="divider" />
        <div className="right">
          {centre ? <div key={centre} className={`status ${centre === 'welcome' ? 'big' : ''}`}>{centre}</div> : (
            <>
              <div className="user-tile hand" onClick={() => go('user')}>
                <div className="pic"><Avatar size={54} /></div>
                <div className="nm">{s.shownUser}</div>
              </div>
              <div className="user-tile hand" onClick={() => setPwOpen(true)}>
                <div className="pic"><svg width="54" height="54" viewBox="0 0 42 42"><rect width="42" height="42" fill="#46566b" /><path d="M21 6l12 4v10c0 8-5 13-12 16C14 33 9 28 9 20V10z" fill="#c9d3e3" stroke="#fff" /><path d="M16 21l4 4 7-8" stroke="#46566b" strokeWidth="3" fill="none" /></svg></div>
                <div className="nm">Administrator</div>
              </div>
              {pwOpen && (
                <div style={{ marginLeft: 82, color: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>Type your password:</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setPwErr(''); }} className="field" style={{ width: 170 }}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') tryPw(); }} />
                    <button className="btn" onClick={tryPw}>Go</button>
                  </div>
                  {pwErr && <div style={{ fontSize: 11 }}>{pwErr}</div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="band-bot">
        {!centre && (
          <div className="poweroff hand" onClick={() => { store.save(); s.phase = 'title'; store.bump(); }}>
            <span className="pw"><PowerGlyph size={16} /></span> Turn off computer
          </div>
        )}
        {!centre && <div className="tip">After you log on, you can add or change accounts.<br />Just go to Control Panel and click User Accounts.</div>}
      </div>
    </div>
  );
}
