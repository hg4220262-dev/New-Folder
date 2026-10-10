import { useState } from 'react';
import { store } from '../../engine/state';
import { sfx } from '../../engine/bus';
import { joinPieces } from '../../story/storage';
import { Group } from './widgets';

const box: React.CSSProperties = { background: '#fff', border: '1px solid #7f9db9', height: 190, overflowY: 'auto', padding: 1 };
const row = (on: boolean): React.CSSProperties => ({ padding: '1px 4px', whiteSpace: 'nowrap', background: on ? 'var(--sel)' : undefined, color: on ? '#fff' : undefined });

/** hscjoin.exe: the reviewer picks downloaded blocks, puts them in order, and joins them. */
export function Joiner() {
  const s = store.s;
  const [order, setOrder] = useState<string[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [at, setAt] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const pieces = Object.values(s.fs)
    .filter((n) => n.parents.includes('hscdl') && /\.blk$/i.test(n.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  const left = pieces.filter((n) => !order.includes(n.id));
  const put = (id: string) => { setOrder([...order, id]); setPick(null); setMsg(''); };
  const add = () => { if (pick && !order.includes(pick)) put(pick); };
  const remove = () => { if (at == null) return; setOrder(order.filter((_, i) => i !== at)); setAt(null); };
  const move = (k: number) => {
    if (at == null) return;
    const j = at + k;
    if (j < 0 || j >= order.length) return;
    const o = [...order];
    [o[at], o[j]] = [o[j], o[at]];
    setOrder(o); setAt(j);
  };
  const join = () => {
    const r = joinPieces(order.filter((id) => s.fs[id]));
    if (r.ok) { setMsg(`Joined. ${r.name} saved to My Documents\\HSC Downloads.`); setOrder([]); setAt(null); }
    else { setMsg(r.why); sfx('error'); }
  };
  return (
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
      <div>HSC Join Utility 1.0. Rejoins a file stored as HSC blocks. Add each block in block order, then click Join.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 86px 1fr', gap: 8, alignItems: 'start' }}>
        <Group title="Downloaded blocks">
          <div style={box}>
            {!pieces.length && <div style={{ color: '#777', padding: 4 }}>No blocks found in My Documents\HSC Downloads.</div>}
            {left.map((n) => <div key={n.id} style={row(pick === n.id)} onClick={() => setPick(n.id)} onDoubleClick={() => put(n.id)}>{n.name}</div>)}
          </div>
        </Group>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 22 }}>
          <button className="btn" onClick={add} disabled={!pick}>Add &gt;</button>
          <button className="btn" onClick={remove} disabled={at == null}>&lt; Remove</button>
          <button className="btn" onClick={() => move(-1)} disabled={at == null || at === 0}>Move up</button>
          <button className="btn" onClick={() => move(1)} disabled={at == null || at === order.length - 1}>Move down</button>
        </div>
        <Group title="Join order">
          <div style={box}>
            {order.map((id, i) => <div key={id} style={row(at === i)} onClick={() => setAt(i)}>{i + 1}. {s.fs[id]?.name ?? '(missing)'}</div>)}
          </div>
        </Group>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn default" onClick={join} disabled={!order.length}>Join</button>
        <span style={{ color: msg.startsWith('Joined') ? '#070' : '#a00' }}>{msg}</span>
      </div>
    </div>
  );
}
