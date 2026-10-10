import { useState } from 'react';
import { store } from '../../engine/state';
import { closeWin } from '../../engine/windows';
import { displayName, typeName, sizeLabel, sizeBytes, isContainer, children, addressOf, canonicalStack } from '../../engine/fs';
import type { FNode, Win } from '../../engine/types';
import { NodeIcon } from '../icons';

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="props-row"><span>{k}</span><span className="v">{v}</span></div>;
export const Check = ({ on, label, onClick }: { on: boolean; label: string; onClick?: () => void }) => (
  <div className="check" onClick={onClick}><span className="box">{on ? '✓' : ''}</span>{label}</div>
);

function General({ n }: { n: FNode }) {
  const s = store.s;
  const loc = n.parents.length ? addressOf(s.fs, canonicalStack(s.fs, n.parents[0]), s.fs.profile.name) : '(none)';
  const kids = isContainer(n) ? children(s.fs, n.id, { hidden: true, system: true }) : [];
  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
        <NodeIcon node={n} />
        <input className="field" style={{ flex: 1 }} value={displayName(n, !s.opts.hideExt)} readOnly />
      </div>
      <div className="hr" />
      <Row k="Type of file:" v={typeName(n)} />
      <Row k="Location:" v={loc} />
      {isContainer(n)
        ? <Row k="Contains:" v={`${kids.filter((c) => !isContainer(c)).length} Files, ${kids.filter(isContainer).length} Folders`} />
        : <Row k="Size:" v={`${sizeLabel(n)} (${sizeBytes(n).toLocaleString('en-GB')} bytes)`} />}
      <div className="hr" />
      <Row k="Created:" v={n.created} />
      <Row k="Modified:" v={n.modified} />
      <Row k="Accessed:" v={n.accessed ?? n.modified} />
      <div className="hr" />
      <div className="props-row">
        <span>Attributes:</span>
        <span style={{ display: 'flex', gap: 12 }}><Check on={!!n.readOnly} label="Read-only" /><Check on={!!n.hidden} label="Hidden" /></span>
      </div>
    </>
  );
}

function History({ n }: { n: FNode }) {
  return (
    <>
      <div style={{ marginBottom: 6, color: '#555' }}>Record History is kept by HRS Archive Tools.</div>
      {n.versions!.slice().reverse().map((v, i) => (
        <div key={i} className={`hist-item ${v.author === 'SYSTEM' ? 'sys' : ''}`}>
          <div className="who"><b>{v.date}</b> — {v.author}</div>
          <div>{v.note}</div>
          {v.content && (
            <div style={{ color: '#777', marginTop: 2 }}>
              Previous version: {v.content.replace(/[#*>]/g, '').replace(/\s+/g, ' ').slice(0, 160)}…
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export function Properties({ win }: { win: Win }) {
  const s = store.s;
  const n = win.fileId ? s.fs[win.fileId] : undefined;
  const [tab, setTab] = useState(win.tab ?? 'general');
  if (!n) return <div className="dlg-body">The item could not be found.</div>;
  const tabs = ['general', 'summary', ...(n.versions?.length ? ['history'] : [])];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingBottom: 8 }}>
      <div className="tabs">
        {tabs.map((t) => (
          <div key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t === 'general' ? 'General' : t === 'summary' ? 'Summary' : 'Record History'}
          </div>
        ))}
      </div>
      <div className="tabpage selectable">
        {tab === 'general' && <General n={n} />}
        {tab === 'summary' && (
          <>
            <Row k="Title:" v={displayName(n, false)} />
            <Row k="Author:" v={n.author ?? ''} />
            <Row k="Comments:" v={n.comments ?? ''} />
            {n.origName && <Row k="Original name:" v={s.chapter >= 3 ? n.origName : '(withheld by HRS Archive Tools)'} />}
          </>
        )}
        {tab === 'history' && <History n={n} />}
      </div>
      <div className="dlg-btns" style={{ justifyContent: 'flex-end', paddingBottom: 0 }}>
        <button className="btn default" onClick={() => closeWin(win.id)}>OK</button>
        <button className="btn" onClick={() => closeWin(win.id)}>Cancel</button>
      </div>
    </div>
  );
}
