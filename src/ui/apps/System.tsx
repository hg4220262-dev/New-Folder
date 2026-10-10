import { useEffect, useState } from 'react';
import { store } from '../../engine/state';
import { emit, sfx } from '../../engine/bus';
import { fmtStamp } from '../../engine/clock';
import { InfoIcon } from '../icons';

export function EventViewer() {
  const s = store.s;
  const [log, setLog] = useState<'Application' | 'System'>('Application');
  const [sel, setSel] = useState<number | null>(null);
  const items = s.log.filter((e) => e.log === log).slice().reverse();
  const cur = items.find((e) => e.id === sel) ?? null;
  // Until chapter 3, HRS events only show the generic "description cannot be found" text.
  const text = (e: (typeof items)[number]) => (e.vague && !s.flags.logOpen ? e.vague : e.text);
  return (
    <>
      <div className="menubar">{['File', 'Action', 'View', 'Help'].map((m) => <span key={m} className="mi">{m}</span>)}</div>
      <div className="events">
        <div className="ev-tree">
          <div className="f">Event Viewer (Local)</div>
          {(['Application', 'Security', 'System'] as const).map((l) => (
            <div key={l} className={`f ${log === l ? 'on' : ''}`} style={{ paddingLeft: 14 }} onClick={() => l !== 'Security' && setLog(l)}>{l}</div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="ev-list">
            <table className="listview">
              <thead><tr><th>Type</th><th>Date / Time</th><th>Source</th><th>Event</th></tr></thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id} className={sel === e.id ? 'sel' : ''} onMouseDown={() => setSel(e.id)}>
                    <td><InfoIcon size={14} type={e.type === 'Error' ? 'error' : e.type === 'Warning' ? 'warn' : 'info'} /><span>{e.type}</span></td>
                    <td>{fmtStamp(e.at)}</td><td>{e.source}</td><td>{e.ev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ev-detail selectable">
            {cur ? `Source: ${cur.source}    Event ID: ${cur.ev}    Type: ${cur.type}\n\nDescription:\n${text(cur)}` : 'Select an event to view its description.'}
          </div>
        </div>
      </div>
      <div className="statusbar">{items.length} event(s)</div>
    </>
  );
}

export function TaskManager() {
  const s = store.s;
  const [sel, setSel] = useState<string | null>(null);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const me = s.user.toLowerCase();
  const procs: [string, string, number][] = [
    ['explorer.exe', me, 14_220], ['hrscont.exe', 'SYSTEM', 43_500], ['hrsassist.exe', 'SYSTEM', 9_840], ['svchost.exe', 'SYSTEM', 18_004],
    ['winlogon.exe', 'SYSTEM', 3_120], ['csrss.exe', 'SYSTEM', 2_888], ['lsass.exe', 'SYSTEM', 1_404], ['taskmgr.exe', me, 3_412],
  ];
  const cpu = (name: string) => (name === 'hrscont.exe' ? Math.min(99, 20 + s.chapter * 14 + Math.floor(Math.random() * 9)) : Math.floor(Math.random() * 3));
  const end = () => {
    if (!sel) return;
    if (sel === 'hrscont.exe') { emit({ t: 'endtask', name: sel }); return; }
    sfx('error');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="tabs"><div className="tab">Applications</div><div className="tab on">Processes</div><div className="tab">Performance</div></div>
      <div className="procs" style={{ flex: 1, overflow: 'auto', background: '#fff', border: '1px solid #7f9db9', margin: '0 6px' }}>
        <table className="listview">
          <thead><tr><th>Image Name</th><th>User Name</th><th>CPU</th><th>Mem Usage</th></tr></thead>
          <tbody>
            {procs.map(([n, u, m]) => (
              <tr key={n} className={sel === n ? 'sel' : ''} onMouseDown={() => setSel(n)}>
                <td><span>{n}</span></td><td>{u}</td><td>{String(cpu(n)).padStart(2, '0')}</td>
                <td style={{ textAlign: 'right' }}>{m.toLocaleString('en-GB')} K</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 6 }}>
        <button className="btn" disabled={!sel} onClick={end}>End Process</button>
      </div>
      <div className="statusbar">
        Processes: {procs.length}
        <span className="cell">CPU Usage: {cpu('hrscont.exe') + 3}%</span>
        <span className="cell">Commit Charge: 211M / 1246M</span>
      </div>
    </div>
  );
}
