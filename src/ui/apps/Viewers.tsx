import { useEffect, useRef, useState } from 'react';
import { store } from '../../engine/state';
import { paint } from '../art/render';
import type { Win } from '../../engine/types';

export function ImageViewer({ win }: { win: Win }) {
  const n = win.fileId ? store.s.fs[win.fileId] : undefined;
  const ref = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const glitch = store.s.glitch;
  useEffect(() => {
    if (!ref.current || !n) return;
    const corrupt = n.art === 'noise' ? 0 : glitch >= 3 && Math.random() < 0.5 ? 0.4 : 0;
    paint(ref.current, n.art ?? 'noise', 480, 360, corrupt);
  }, [n?.art, n?.id, glitch >= 3]);
  return (
    <>
      <div className="imgv">
        <canvas ref={ref} width={480} height={360} style={{ width: 480 * zoom, height: 360 * zoom }} />
      </div>
      {n?.comments && <div className="imgv-cap selectable">{n.comments}</div>}
      <div className="imgv-bar">
        <button className="btn" style={{ minWidth: 30 }} onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))}>+</button>
        <button className="btn" style={{ minWidth: 30 }} onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}>−</button>
        <button className="btn" style={{ minWidth: 60 }} onClick={() => setZoom(1)}>Best Fit</button>
      </div>
    </>
  );
}

export function SheetViewer({ win }: { win: Win }) {
  const n = win.fileId ? store.s.fs[win.fileId] : undefined;
  const rows = n?.rows ?? [];
  const [cell, setCell] = useState<[number, number] | null>(null);
  const [find, setFind] = useState('');
  const cols = rows[0]?.length ?? 0;
  const letters = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i));
  const f = find.trim().toLowerCase();
  const hit = (r: string[], i: number) => !!f && i > 0 && r.some((c) => c.toLowerCase().includes(f));
  const hits = rows.reduce((a, r, i) => a + (hit(r, i) ? 1 : 0), 0);
  return (
    <>
      <div className="sheet-bar">
        <span style={{ width: 40 }}>{cell ? `${letters[cell[1]]}${cell[0] + 1}` : 'A1'}</span>
        <div className="fx">{cell ? rows[cell[0]]?.[cell[1]] : rows[0]?.[0]}</div>
        <span>Find:</span>
        <input className="field" style={{ width: 110 }} value={find} onChange={(e) => setFind(e.target.value)} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} />
      </div>
      <div className="sheet">
        <table>
          <thead><tr><th />{letters.map((l) => <th key={l}>{l}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`${i === 0 ? 'head' : ''} ${hit(r, i) ? 'hl' : ''}`}>
                <td className="rh">{i + 1}</td>
                {r.map((c, j) => <td key={j} onMouseDown={() => setCell([i, j])} style={cell && cell[0] === i && cell[1] === j ? { outline: '2px solid #000', outlineOffset: -2 } : undefined}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="statusbar">
        Ready
        <span className="cell" style={{ marginLeft: 'auto' }}>{rows.length ? `Rows: ${rows.length - 1}` : ''}</span>
        {f && <span className="cell">Matches: {hits}</span>}
      </div>
    </>
  );
}
