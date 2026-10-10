import { useEffect, useRef, useState } from 'react';
import { store } from '../../engine/state';
import { stamp } from '../../engine/clock';
import { sfx } from '../../engine/bus';
import { hrsLog, journalLine } from '../../engine/director';
import { chooseEnding } from '../../story/climax';
import { HSC_HOST, HSC_USER, HSC_PASSWORD, RACKS, NODES, OFFLINE, FILES, specOf, nodeLabel, rackOf, rackDown, fetchReplica,  WEIR_HOST, SLUICE_CODE, weirMounted, WEIR_FILES, WEIR_PAPERS, WEIR_DIRS, WEIR_OFFICER, type Fetch } from '../../story/storage';

const AUDIT: [string, string, string][] = [
  ['12/02/2008 10:14', 't.brandt', 'LOGIN'],
  ['12/02/2008 10:31', 't.brandt', 'FETCH board_report_12081979.doc block 1 (dn-11.hsc) OK'],
  ['14/02/2008 09:50', 't.brandt', 'FETCH board_report_12081979.doc block 3 (dn-32.hsc) OK'],
  ['27/02/2008 09:00', 'SYSTEM', 'ACCOUNT t.brandt disabled (user reassigned)'],
  ['03/06/2008 11:02', 's.okafor', 'LOGIN'],
  ['03/06/2008 11:09', 's.okafor', 'FETCH block 1 (dn-21.hsc) TIMEOUT (rack 2, no heartbeat)'],
  ['03/06/2008 11:10', 's.okafor', 'FETCH block 5 (dn-21.hsc) TIMEOUT (rack 2, no heartbeat)'],
  ['10/06/2008 09:00', 'SYSTEM', 'ACCOUNT s.okafor disabled (user reassigned)'],
  ['30/06/2008 14:20', 'm.price', 'LOGIN'],
  ['04/07/2008 15:41', 'm.price', 'FETCH board_report_12081979.doc block 5 (dn-32.hsc) OK'],
  ['04/07/2008 15:44', 'm.price', 'JOIN board_report_12081979.doc 5 of 5'],
  ['04/07/2008 15:44', 'SYSTEM', 'DELETE joined copy (m.price)'],
  ['04/07/2008 15:45', 'SYSTEM', 'ACCOUNT m.price disabled (contract ended)'],
];
const term: React.CSSProperties = { background: '#111', color: '#7f7', padding: 8, fontFamily: 'var(--mono)', fontSize: 17, lineHeight: '15px' };

/** The cluster's NameNode web page. Reached only through Internet Explorer, and only after logging in. */
export function Hsc({ rest, go }: { rest: string; go: (u: string) => void }) {
  const s = store.s;
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [res, setRes] = useState<Record<string, Fetch>>({});
  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [off, setOff] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const [armed, setArmed] = useState(false);
  const base = `http://${HSC_HOST}`;
  const q = new URLSearchParams(rest.split('?')[1] ?? '');
  const path = rest.split('?')[0] || '/';
  // Reading a weir file is recorded after the page has drawn, not while it draws.
  const weirFile = path === '/weir' && s.flags.weirAuth ? q.get('f') : null;
  useEffect(() => {
    if (!weirFile || !WEIR_FILES[weirFile]) return;
    const seen: string[] = (s.flags.weirRead ??= []);
    if (seen.includes(weirFile)) return;
    seen.push(weirFile);
    if (seen.length === WEIR_PAPERS) { journalLine(`Reviewer read ${WEIR_PAPERS} records on nantweir.stn.\n(host is outside the archive; cannot be harmonised)`); hrsLog(`Reviewer opened ${WEIR_PAPERS} records on nantweir.stn (outside the archive).`, 'Information'); }
    store.bump();
  }, [weirFile]);
  useEffect(() => {
    if (path !== '/weir' || !weirMounted() || s.flags.weirSeenDown) return;
    s.flags.weirSeenDown = true;
    if (!s.flags.coaxUp) { hrsLog('Volume nantweir.stn was opened from the cluster page. Link state: no carrier.', 'Warning'); journalLine('Reviewer opened nantweir.stn from the cluster.\nLink: no carrier.'); }
    store.bump();
  }, [path]);
  // A stable component: one defined per render would remount on every update and swallow the first click.
  const goRef = useRef(go);
  goRef.current = go;
  const [A] = useState(() => ({ to, children }: { to: string; children: React.ReactNode }) => <a className="hand ie-a" onClick={() => goRef.current(`http://${HSC_HOST}${to}`)}>{children}</a>);

  if (!s.flags.hscAuth) {
    const login = () => {
      if (u === HSC_USER && p === HSC_PASSWORD) { s.flags.hscAuth = true; store.bump(); }
      else setErr('401 Unauthorized. Incorrect user name or password.');
    };
    return (
      <>
        <h1>HSC NameNode</h1>
        <p>Halden Storage Cluster. Authorised users only.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 200px', gap: 6, margin: '10px 0' }}>
          <span>User name:</span><input className="field" value={u} onChange={(e) => setU(e.target.value)} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} />
          <span>Password:</span><input className="field" type="password" value={p} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') login(); }} />
        </div>
        <button className="btn default" onClick={login}>Log in</button>
        {err && <p style={{ color: '#a00' }}>{err}</p>}
      </>
    );
  }

  const head = (
    <p style={{ background: '#eef3ff', padding: 6 }}>
      <A to="/">Cluster</A> · <A to="/browse">Browse the file system</A> · <A to="/logs">Audit log</A>{weirMounted() && <> · <A to="/weir">Mounted: {WEIR_HOST}</A></>}
    </p>
  );

  // What the session can see, the way the page would say it. No checklist.
  const route = (
    <p style={{ background: '#f6f6e8', padding: 6, fontSize: 12 }}>
      Session: {HSC_USER} · Volumes: /records/carrow{weirMounted() && <>, {WEIR_HOST} ({s.flags.weirAuth ? 'logged on' : s.flags.coaxUp ? 'carrier, no session' : 'no carrier'})</>}
    </p>
  );
  if (path === '/weir' && weirMounted()) {
    if (!s.flags.coaxUp) {
      return (<>{head}{route}<h1>{WEIR_HOST}</h1><pre style={term}>{`NANT WEIR TELEMETRY TERMINAL\n\nLINK DOWN. No carrier.\nTrunk       : Carrow Cable trunk 1, node CN-7\nReturn path : blocked`}</pre></>);
    }
    if (!s.flags.weirAuth) {
      return (<>{head}{route}<h1>{WEIR_HOST}</h1><pre style={term}>{'NANT WEIR TELEMETRY TERMINAL\n\nCarrier present.\nNo session.\nService accounts only. Logins on the dial-in port.'}</pre></>);
    }
    const d = q.get('d');
    const f = q.get('f');
    const w = f ? WEIR_FILES[f] : null;
    const dir = d ? WEIR_DIRS[d] : null;
    if (w) {
      return (<>{head}{route}<h1>{WEIR_HOST}:/{d}/{w.name}</h1><pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', fontSize: 17, lineHeight: '15px' }}>{w.text}</pre><p><A to={`/weir?d=${d}`}>Back</A> · <A to="/weir">Station root</A></p></>);
    }
    if (dir) return (<>{head}{route}<h1>{WEIR_HOST}:/{d}/</h1><p>{dir.blurb}</p>
      <table className="listview"><thead><tr><th>Name</th></tr></thead><tbody>
        {dir.files.map((k) => <tr key={k}><td><A to={`/weir?d=${d}&f=${k}`}>{WEIR_FILES[k].name}</A></td></tr>)}
        {d === 'station' && <tr><td><A to="/weir/panel">sluice_panel</A> (live)</td></tr>}
      </tbody></table><p><A to="/weir">Station root</A></p></>);
    return (<>{head}{route}<h1>{WEIR_HOST}:/</h1>
      <p>Station file store. Mounted read-only over the Carrow Cable link.</p>
      <table className="listview"><thead><tr><th>Directory</th><th>Contents</th></tr></thead><tbody>
        {Object.entries(WEIR_DIRS).map(([k, v]) => <tr key={k}><td><A to={`/weir?d=${k}`}>/{v.label}/</A></td><td>{v.blurb}</td></tr>)}
      </tbody></table></>);
  }
  if (path === '/weir/panel' && weirMounted() && s.flags.weirAuth) {
    const lockOver = s.playMs - (s.flags.sluiceLockAt ?? 0) > 120_000;
    const locked = (s.flags.sluiceFails ?? 0) >= 5 && !lockOver;
    const [a, b] = SLUICE_CODE.split('-');
    const ok1 = c1.trim().toLowerCase() === a, ok2 = c2.trim() === b, ok3 = off.toLowerCase().includes(WEIR_OFFICER);
    // The interlock checks the way the real one would: the code first, then the authority behind it.
    const fail = (why: string) => {
      if ((s.flags.sluiceFails ?? 0) >= 5 && lockOver) s.flags.sluiceFails = 0;
      s.flags.sluiceFails = (s.flags.sluiceFails ?? 0) + 1;
      if (s.flags.sluiceFails >= 5) { s.flags.sluiceLockAt = s.playMs; hrsLog('Sluice panel on nantweir.stn locked after 5 rejected attempts (2 min).', 'Warning'); }
      setArmed(false); sfx('error'); store.bump();
      setErr(s.flags.sluiceFails >= 5 ? 'Panel locked.' : why);
    };
    const release = () => {
      if (locked || s.flags.sluicesOpen) return;
      if (!(ok1 && ok2)) { fail('Station code rejected.'); return; }
      if (!ok3) { fail('Station code accepted. Officer not on the authority list.'); return; }
      if (!armed) { setArmed(true); setErr(''); return; }
      s.flags.sluicesOpen = true;
      hrsLog('Sluice release initiated on nantweir.stn from a remote session (account rowley).', 'Error');
      journalLine('Reviewer released the sluices at nantweir.stn.\nLevel 150.0 m, falling. Mill Row 141.2 m: 8.8 m under.');
      store.bump();
      const steps = ['Interlock cleared. Officer accepted.', 'Siren: ON (downstream warning).', 'Gate motors energised.', 'Gate 1 rising ... 2 m.', 'Gate 2 rising ... 2 m.', 'Gate 3 rising ... 2 m.', 'Level 149.9 m ... 149.7 m ... falling.', 'RELEASE IN PROGRESS. Recall: not available.'];
      steps.forEach((l, i) => setTimeout(() => { setLines((x) => [...x, l]); sfx(i === 1 ? 'error' : 'ding'); }, 900 * (i + 1)));
      setTimeout(() => chooseEnding('drain'), 900 * (steps.length + 3));
    };
    return (<>{head}{route}<h1>nantweir.stn:/station/sluice_panel</h1>
      <p>Level 150.0 m. Gates: <b>{s.flags.sluicesOpen ? 'OPENING' : 'CLOSED'}</b>. Rejected attempts: {(s.flags.sluiceFails ?? 0) >= 5 && lockOver ? 0 : s.flags.sluiceFails ?? 0} of 5.</p>
      {locked ? <p style={{ color: '#a00' }}>PANEL LOCKED. 5 rejected attempts. Lockout 2 min.</p> : s.flags.sluicesOpen ? (
        <pre style={{ ...term, minHeight: 120 }}>{lines.join('\n')}</pre>
      ) : (<>
        <p>Release requires the station code (two parts) and an authorising officer. Authority list: 1 entry, dated 06/1979.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 200px', gap: 6, margin: '10px 0' }}>
          <span>Code, part 1:</span><span><input className="field" value={c1} onChange={(e) => setC1(e.target.value)} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} /></span>
          <span>Code, part 2:</span><span><input className="field" value={c2} onChange={(e) => setC2(e.target.value)} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} /></span>
          <span>Officer:</span><span><input className="field" value={off} onChange={(e) => setOff(e.target.value)} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} /></span>
        </div>
        {armed && <p style={{ color: '#a00' }}>Full release: 150.0 m to 118.0 m (gate sill). Cannot be recalled once begun. Confirm to proceed.</p>}
        <button className="btn default" onClick={release}>{armed ? 'Confirm release' : 'Release sluices'}</button>
        {err && <p style={{ color: '#a00' }}>{err}</p>}</>)}
    </>);
  }
  if (path === '/browse') {
    return (<>{head}<h1>/records/carrow/</h1>
      <table className="listview"><thead><tr><th>Name</th><th>Blocks</th><th>Replication</th><th>Health</th></tr></thead><tbody>
        {FILES.map((f) => <tr key={f.key}><td><A to={`/file?file=${f.key}`}>{f.name}</A></td><td>{f.text.length}</td><td>3</td><td>Degraded</td></tr>)}
        <tr><td>census_1978.xls</td><td>12</td><td>3</td><td>Healthy</td></tr>
        <tr><td>gate_log_aug1979.log</td><td>1</td><td>3</td><td>Healthy</td></tr>
      </tbody></table></>);
  }
  if (path === '/logs') {
    return (<>{head}<h1>NameNode audit log</h1>
      <table className="listview"><thead><tr><th>Time</th><th>User</th><th>Action</th></tr></thead><tbody>
        {AUDIT.map(([t, who, what], i) => <tr key={i}><td>{t}</td><td>{who}</td><td>{what}</td></tr>)}
        <tr><td>{stamp()}</td><td>{HSC_USER}</td><td>LOGIN</td></tr>
      </tbody></table></>);
  }
  const spec = specOf(q.get('file') ?? 'report');
  if (path === '/file') {
    return (<>{head}<h1>{spec.name}</h1>
      <table className="listview"><thead><tr><th>Block</th><th>Replicas</th></tr></thead><tbody>
        {spec.text.map((_, i) => <tr key={i}><td><A to={`/block?file=${spec.key}&id=${i + 1}`}>Block {i + 1} of {spec.text.length}</A></td><td>3</td></tr>)}
      </tbody></table></>);
  }
  if (path === '/block') {
    const b = Math.max(1, Math.min(spec.text.length, +(q.get('id') ?? 1)));
    return (<>{head}<h1>{spec.name}: block {b} of {spec.text.length}</h1>
      <table className="listview"><thead><tr><th>Copy</th><th>Rack</th><th>DataNode</th><th>Status</th><th /></tr></thead><tbody>
        {spec.place[b - 1].map((r, i) => {
          const key = `${spec.key}-${b}-${i}`;
          return (<tr key={key}><td>{i + 1}</td><td>{RACKS[rackOf(r.node)]}</td><td>{nodeLabel(r.node)}</td>
            <td>{rackDown(r.node) ? 'No heartbeat' : 'Live'}</td>
            <td><button className="btn" onClick={() => setRes({ ...res, [key]: fetchReplica(spec.key, b, i) })}>Fetch</button>
              {' '}{res[key] && { timeout: 'Connection timed out.', exists: 'Already downloaded.', ok: 'Saved.', crc: 'Saved.' }[res[key].status]}</td></tr>);
        })}
      </tbody></table>
      <p>Fetched replicas are saved to My Documents\HSC Downloads.</p></>);
  }
  return (<>{head}<h1>HSC NameNode</h1>
    <p>Live DataNodes: {NODES.filter((n) => !rackDown(n)).length} of {NODES.length}.{s.flags.rack2On ? '' : ' Rack 2 (Plant Room): top-of-rack switch not responding. Last heartbeat 03/2008.'}</p>
    <table className="listview"><thead><tr><th>Rack</th><th>DataNodes</th><th>State</th></tr></thead><tbody>
      {Object.entries(RACKS).map(([k, v]) => <tr key={k}><td>{v}</td><td>{NODES.filter((n) => rackOf(n) === k).map(nodeLabel).join(', ')}</td><td>{k === OFFLINE && !s.flags.rack2On ? 'Unreachable' : 'Live'}</td></tr>)}
    </tbody></table></>);
}
