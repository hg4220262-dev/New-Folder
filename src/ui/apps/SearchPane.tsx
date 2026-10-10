import { Dog } from './ExplorerChrome';

interface Props {
  q: string;
  setQ: (v: string) => void;
  run: () => void;
  back: () => void;
  done: boolean;
  count: number;
}

export function SearchPane({ q, setQ, run, back, done, count }: Props) {
  return (
    <div className="taskpane">
      <div className="tp-box">
        <div className="tp-head">Search Companion</div>
        <div className="tp-body search-pane">
          <div className="det">All or part of the file name, or a word or phrase in the file:</div>
          <input
            className="field" value={q} spellCheck={false}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') run(); }}
          />
          <div className="det">Look in: Local Hard Drives (C:)</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={back}>Back</button>
            <button className="btn default" onClick={run}>Search</button>
          </div>
          {done && <div className="det">{count ? `Search is complete. There are ${count} results.` : 'Search is complete. There are no results to display.'}</div>}
          <div className="dog"><Dog /></div>
        </div>
      </div>
    </div>
  );
}
