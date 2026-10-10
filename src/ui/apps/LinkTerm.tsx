import { useEffect, useRef, useState } from 'react';
import { store } from '../../engine/state';
import { sfx } from '../../engine/bus';
import { hrsLog, journalLine, balloon } from '../../engine/director';
import { weirMounted, COAX_USER, COAX_PASSWORD, COAX_CHANNEL, COAX_PLAN, WEIR_USER, WEIR_PASSWORD } from '../../story/storage';

type Pending = null | { host: 'cn7' | 'weir'; stage: 'user' | 'pass'; user: string };
const BANNER = ['CARROW CABLE / HSC LINK TERMINAL 1.2', 'Trunk 1 of 1 up. Type HELP.', ''];
const HOSTS = [
  ['cn7', 'Carrow Cable distribution node CN-7', 'ANSWERS'],
  ['pump', 'Mill Lane pumping station', 'no carrier'],
  ['weir', 'Nant Weir telemetry terminal', 'no carrier'],
];

/** A scripted link terminal: the reviewer dials a chain of old hosts with logins found on the laptop. */
export function LinkTerm() {
  const s = store.s;
  const [lines, setLines] = useState<string[]>(BANNER);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [pend, setPend] = useState<Pending>(null);
  const end = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => { end.current?.scrollIntoView(); }, [lines]);

  const say = (out: string[], then?: () => void, gap = 260) => {
    setBusy(true);
    out.forEach((l, i) => setTimeout(() => { if (!alive.current) return; setLines((x) => [...x, l]); if (l && i % 2 === 0) sfx('click'); }, gap * (i + 1)));
    setTimeout(() => { if (!alive.current) return; setBusy(false); then?.(); }, gap * (out.length + 1));
  };

  const login = (host: 'cn7' | 'weir', user: string, pass: string) => {
    const ok = host === 'cn7' ? user === COAX_USER && pass === COAX_PASSWORD : user === WEIR_USER && pass === WEIR_PASSWORD;
    if (!ok) { sfx('error'); say(['Login incorrect.', '']); return; }
    if (host === 'cn7') {
      say(['Authenticating ........ ok', 'Session key accepted.', 'CN-7  modulator 2  return path: BLOCKED', 'Node commands: PLAN  TUNE <channel>', ''], () => {
        s.flags.coaxAuth = true;
        hrsLog('A session was opened on cable distribution node CN-7 from the link terminal.', 'Warning');
        journalLine('Reviewer logged on to Carrow Cable node CN-7.\n(from linkterm.exe)');
        store.bump();
      });
    } else {
      say(['Authenticating ........ ok', 'Handshake with nantweir.stn ...... ok', 'Session open (service account).', 'Store exported to hsc as nantweir.stn (read-only).', ''], () => {
        s.flags.weirAuth = true;
        hrsLog('A service account logged on to nantweir.stn from the link terminal.', 'Warning');
        journalLine('Reviewer logged on to nantweir.stn as rowley.\n(host is outside the archive; not under Authority)');
        balloon('HSC Client', 'Connected to nantweir.stn as rowley.'); sfx('ding');
        store.bump();
      });
    }
  };

  const run = (raw: string) => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    const c = (cmd ?? '').toLowerCase();
    if (!c) return;
    if (c === 'help') return say(['HELP     this list', 'SCAN     hosts on trunk 1', 'CONNECT  <host>', 'PLAN     channel plan (node session)', 'TUNE     <channel>  set return path (node session)', 'STATUS   link status', 'CLEAR    clear screen', '']);
    if (c === 'clear') return setLines(BANNER);
    if (c === 'status') return say([`CN-7 session : ${s.flags.coaxAuth ? 'open' : 'closed'}`, `Return path  : ${s.flags.coaxUp ? 'open' : 'blocked'}`, `Weir         : ${s.flags.weirAuth ? 'logged on' : s.flags.coaxUp ? 'carrier up' : 'no carrier'}`, '']);
    if (c === 'scan') {
      if (!weirMounted()) return say(['Sweeping trunk 1 ...', 'Carrier tone. No host answers.', '']);
      return say(['Sweeping trunk 1 ...', '', ...HOSTS.map(([h, d, st]) => `${h.padEnd(6)} ${d.padEnd(38)} ${h === 'weir' && s.flags.coaxUp ? 'ANSWERS' : st}`), '']);
    }
    if (c === 'plan') {
      if (!s.flags.coaxAuth) return say(['Not connected to a node.', '']);
      return say(['CN-7 CHANNEL PLAN', ...COAX_PLAN.map(([n, p]) => `${String(n).padStart(3)}  ${p}`), ''], undefined, 120);
    }
    if (c === 'tune') {
      if (!s.flags.coaxAuth) return say(['Not connected to a node.', '']);
      const n = +args[0];
      if (!n) return say(['TUNE <channel>', '']);
      if (n !== COAX_CHANNEL) { sfx('error'); return say([`Tuning ch ${n} ...`, 'Listening ...', 'No carrier.', '']); }
      return say([`Tuning ch ${n} ...`, 'Listening ...', '', '.:|:.. carrier ..:|:.', 'Carrier present: NANT WEIR TELEMETRY', 'Return path open.', ''], () => {
        s.flags.coaxUp = true;
        hrsLog('Cable node CN-7 return path retuned from the link terminal. Carrier detected: NANT WEIR TELEMETRY.', 'Warning');
        journalLine('Return path open on CN-7.\nCarrier: NANT WEIR TELEMETRY.');
        balloon('HSC Client', 'Carrier detected on the return path: NANT WEIR TELEMETRY.'); sfx('ding');
        store.bump();
      }, 420);
    }
    if (c === 'connect') {
      const h = (args[0] ?? '').toLowerCase();
      if ((h === 'cn7' || h === 'weir' || h === 'pump') && !weirMounted()) { sfx('error'); return say([`Dialling ${h} ...`, 'No answer.', '']); }
      if (h === 'cn7') return say(['Dialling cn7 ...', 'Carrier. Handshake ... ok', 'CARROW CABLE NODE CN-7', 'Engineering access only.'], () => setPend({ host: 'cn7', stage: 'user', user: '' }));
      if (h === 'weir') {
        if (!s.flags.coaxUp) { sfx('error'); return say(['Dialling weir ...', 'No route to host. No carrier on the return path.', '']); }
        return say(['Dialling weir ...', 'Carrier. Handshake ... ok', 'NANT WEIR TELEMETRY TERMINAL', 'Service accounts only.'], () => setPend({ host: 'weir', stage: 'user', user: '' }));
      }
      if (h === 'pump') { sfx('error'); return say(['Dialling pump ...', 'No carrier.', '']); }
      return say(['CONNECT <host>  (hosts: SCAN)', '']);
    }
    say([`${cmd}: unknown command. Type HELP.`, '']);
  };

  const submit = () => {
    if (busy) return;
    const v = input;
    setInput('');
    if (pend?.stage === 'user') { setLines((x) => [...x, `login: ${v}`]); setPend({ ...pend, stage: 'pass', user: v }); return; }
    if (pend?.stage === 'pass') { setLines((x) => [...x, 'password: ']); const p = pend; setPend(null); login(p.host, p.user, v); return; }
    setLines((x) => [...x, `> ${v}`]);
    run(v);
  };

  return (
    <div style={{ background: '#050805', color: '#7dff9a', fontFamily: 'var(--mono)', fontSize: 19, lineHeight: '16px', padding: '4px 6px', flex: 1, minHeight: 0, overflowY: 'auto', whiteSpace: 'pre-wrap' }}
      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}>
      {lines.map((l, i) => <div key={i}>{l || ' '}</div>)}
      {!busy && (
        <div style={{ display: 'flex' }}>
          <span>{pend ? (pend.stage === 'user' ? 'login: ' : 'password: ') : '> '}</span>
          <input autoFocus spellCheck={false} type={pend?.stage === 'pass' ? 'password' : 'text'} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') submit(); }}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'inherit', font: 'inherit', padding: 0 }} />
        </div>
      )}
      <div ref={end} />
    </div>
  );
}
