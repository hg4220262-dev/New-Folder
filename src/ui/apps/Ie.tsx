import { useState } from 'react';
import type { Win } from '../../engine/types';
import { HOME, lookup, normalize } from '../../story/web';
import { store } from '../../engine/state';
import { Hsc } from './Hsc';
import { HSC_HOST } from '../../story/storage';
import { hrsLog } from '../../engine/director';

const isHsc = (u: string) => normalize(u).startsWith(HSC_HOST);
const titleOf = (u: string) => (isHsc(u) ? 'HSC NameNode' : lookup(u)?.title ?? 'Cannot find server');

/** Internet Explorer, limited to the pages listed in story/web.ts. */
export function Ie({ win }: { win: Win }) {
  const [hist, setHist] = useState<string[]>([win.url || HOME]);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState<string | null>(null);
  const url = hist[i];
  const blocked = !store.s.flags.webUnblocked;
  if (blocked && !store.s.flags.webBlockLogged) { store.s.flags.webBlockLogged = true; hrsLog('HRS web filter: request from Internet Explorer blocked (archive review open).', 'Warning'); }
  const page = lookup(url);
  const go = (u: string) => {
    const t = u.trim();
    if (!t) return;
    const full = /^https?:\/\//i.test(t) ? t : `http://${t}`;
    setHist([...hist.slice(0, i + 1), full]); setI(i + 1); setTyped(null);
    win.title = `${titleOf(full)} - Microsoft Internet Explorer`;
  };
  const move = (k: number) => { const n = i + k; if (n < 0 || n >= hist.length) return; setI(n); win.title = `${titleOf(hist[n])} - Microsoft Internet Explorer`; };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="toolbar">
        <div className={`tb ${i ? '' : 'dis'}`} onClick={() => move(-1)}>Back</div>
        <div className={`tb ${i < hist.length - 1 ? '' : 'dis'}`} onClick={() => move(1)}>Forward</div>
        <div className="tb" onClick={() => setHist([...hist])}>Refresh</div>
        <div className="tb" onClick={() => go(HOME)}>Home</div>
      </div>
      <div className="addrbar"><span className="lab">Address</span>
        <div className="addr"><input value={typed ?? url} spellCheck={false} onChange={(e) => setTyped(e.target.value)} onFocus={(e) => e.target.select()}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') go((e.target as HTMLInputElement).value); }} /></div>
        <div className="go" onClick={() => go(typed ?? url)}>Go</div>
      </div>
      <div className="ie-page selectable">
        {blocked ? (<>
          <h1>Web page blocked</h1>
          <p>The HRS web filter is ON while an archive review is open. The requested page was not retrieved. If you need web access to complete the review, contact your administrator.</p>
          <p>Address: {normalize(url)}</p>
        </>) : isHsc(url) ? <Hsc rest={normalize(url).slice(HSC_HOST.length)} go={go} /> : page ? (<>
          <h1>{page.lines[0]}</h1>
          {page.lines.slice(1).map((l, k) => <p key={k}>{l}</p>)}
          {page.links?.map(([t, u]) => <div key={u}><a className="hand ie-a" onClick={() => go(u)}>{t}</a></div>)}
        </>) : (<>
          <h1>The page cannot be displayed</h1>
          <p>The page you are looking for is currently unavailable. The Web site might be experiencing technical difficulties.</p>
          <p>Cannot find server or DNS Error: {normalize(url)}</p>
        </>)}
      </div>
      <div className="statusbar">Done</div>
    </div>
  );
}
