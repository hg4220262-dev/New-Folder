import { useEffect, useMemo, useRef, useState } from 'react';
import { store } from '../../engine/state';
import { saveFile, newNode } from '../../engine/actions';
import { closeWin } from '../../engine/windows';
import { makeCtx, liveContent } from '../../story/world';
import type { FNode, Win } from '../../engine/types';
import { openMenu } from '../Menu';
import { sfx } from '../../engine/bus';

export function fileText(n: FNode): string {
  const s = store.s;
  return liveContent(n, makeCtx(s.user, s.fullName), s.chapter, s.flags).replace(/\r\n/g, '\n');
}

/** Text that rewrites itself while you watch (chapter 4+ glitch). */
function useLiveRewrite(n: FNode | undefined, text: string): string {
  const [shown, setShown] = useState(text);
  const prev = useRef(text);
  useEffect(() => {
    if (prev.current === text) { setShown(text); return; }
    const from = prev.current;
    prev.current = text;
    if (store.s.glitch < 2 || store.settings.reduceMotion) { setShown(text); return; }
    // Type the change in character by character, as if someone else is editing.
    let i = 0;
    const common = [...from].findIndex((c, k) => c !== text[k]);
    const start = common < 0 ? Math.min(from.length, text.length) : common;
    const id = setInterval(() => {
      i += 2;
      setShown(text.slice(0, start + i) + from.slice(start + i));
      if (i % 6 === 0) sfx('type');
      if (start + i >= text.length) { clearInterval(id); setShown(text); }
    }, 45);
    return () => clearInterval(id);
  }, [text, n?.id]);
  return shown;
}

export function Notepad({ win }: { win: Win }) {
  const s = store.s;
  const n = win.fileId ? s.fs[win.fileId] : undefined;
  const source = n ? fileText(n) : '';
  const live = useLiveRewrite(n, source);
  const [draft, setDraft] = useState<string | null>(null);
  const [wrap, setWrap] = useState(true);
  const value = draft ?? live;
  const dirty = draft != null && draft !== source;
  useEffect(() => { if (draft != null && draft === source) setDraft(null); }, [source]);

  const save = () => {
    if (!n) {
      const id = newNode('mydocs', 'txt');
      win.fileId = id;
      win.title = `${store.s.fs[id].name.replace(/\.txt$/, '')} - Notepad`;
      saveFile(id, value);
      setDraft(null);
      return;
    }
    if (saveFile(n.id, value)) setDraft(null);
  };
  const keys = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
  };
  return (
    <>
      <div className="menubar">
        <span className="mi" onClick={(e) => openMenu(e, [
          { label: 'Save', run: save, disabled: !!n?.readOnly },
          { sep: true },
          { label: 'Exit', run: () => closeWin(win.id) },
        ])}>File</span>
        <span className="mi" onClick={(e) => openMenu(e, [{ label: 'Undo', disabled: true }, { label: 'Time/Date', run: () => setDraft(value + new Date(store.s.playMs).toISOString().slice(11, 16) + ' 14/08/2008') }])}>Edit</span>
        <span className="mi" onClick={(e) => openMenu(e, [{ label: 'Word Wrap', checked: wrap, run: () => setWrap(!wrap) }])}>Format</span>
        <span className="mi">View</span>
        <span className="mi">Help</span>
      </div>
      <textarea
        className={`notepad ${wrap ? 'wrap' : ''} selectable`}
        value={value}
        readOnly={n?.kind === 'dat'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={keys}
        spellCheck={false}
      />
      {dirty && <div className="statusbar" style={{ height: 18 }}>Unsaved changes. Ctrl+S to save.</div>}
    </>
  );
}

/** Very small markdown-ish renderer for WordPad documents. */
function renderDoc(text: string) {
  const out: React.ReactNode[] = [];
  const lines = text.split('\n');
  let list: string[] = [];
  const inline = (t: string) => t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) =>
    p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith('*') && p.length > 2 ? <i key={i}>{p.slice(1, -1)}</i> : p);
  const flush = () => { if (list.length) { out.push(<ul key={out.length}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; } };
  for (const l of lines) {
    if (l.startsWith('- ')) { list.push(l.slice(2)); continue; }
    flush();
    if (l.startsWith('# ')) out.push(<h1 key={out.length}>{l.slice(2)}</h1>);
    else if (l.startsWith('## ')) out.push(<h2 key={out.length}>{l.slice(3)}</h2>);
    else if (l.startsWith('> ')) out.push(<blockquote key={out.length}>{inline(l.slice(2))}</blockquote>);
    else if (l.trim()) out.push(<p key={out.length}>{inline(l)}</p>);
  }
  flush();
  return out;
}

export function WordPad({ win }: { win: Win }) {
  const n = win.fileId ? store.s.fs[win.fileId] : undefined;
  const text = useLiveRewrite(n, n ? fileText(n) : '');
  const body = useMemo(() => renderDoc(text), [text]);
  return (
    <>
      <div className="menubar">
        {['File', 'Edit', 'View', 'Insert', 'Format', 'Help'].map((m) => <span key={m} className="mi" onClick={m === 'File' ? (e) => openMenu(e, [{ label: 'Exit', run: () => closeWin(win.id) }]) : undefined}>{m}</span>)}
      </div>
      <div className="wp-ruler">{Array.from({ length: 60 }, (_, i) => <i key={i} style={{ left: 30 + i * 10, height: i % 5 ? 3 : 7 }} />)}</div>
      <div className="wp-wrap">
        <div className="wp-page selectable">
          {body}
          {n?.readOnly && n.id === 'cert' && <div className="stamp">OFFICIAL RECORD</div>}
        </div>
      </div>
      <div className="statusbar">For Help, press F1{n?.readOnly ? <span className="cell" style={{ marginLeft: 'auto' }}>Read-only</span> : null}</div>
    </>
  );
}
