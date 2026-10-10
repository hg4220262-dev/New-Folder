import { useEffect, useRef, useState } from 'react';
import { closeWin } from '../../engine/windows';
import type { Win } from '../../engine/types';
import { runCommand, cwdText, type Shell } from './cmdEngine';
import { BRAND } from '../../brand';

export function Cmd({ win }: { win: Win }) {
  const sh = useRef<Shell>({ cwd: ['c', 'docset', 'profile'] });
  const [out, setOut] = useState(`${BRAND.shellBanner}\n${BRAND.shellCopyright}\n\n`);
  const [line, setLine] = useState('');
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { box.current?.scrollTo(0, 1e9); }, [out, line]);
  useEffect(() => { input.current?.focus({ preventScroll: true }); }, []);
  const prompt = () => `${cwdText(sh.current)}>`;
  const exec = () => {
    const l = line;
    const before = prompt();
    setHist((h) => [l, ...h].slice(0, 30));
    setHi(-1);
    setLine('');
    const res = runCommand(sh.current, l);
    if (res === '__EXIT__') { closeWin(win.id); return; }
    if (res === null) { setOut(''); return; }
    setOut((o) => `${o}${before}${l}\n${res}${res ? '\n' : ''}`);
  };
  const keys = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') exec();
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const i = Math.min(hist.length - 1, hi + 1);
      if (i >= 0) { setHi(i); setLine(hist[i]); }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const i = hi - 1;
      setHi(i);
      setLine(i >= 0 ? hist[i] : '');
    }
  };
  return (
    <div className="cmd" ref={box} onMouseUp={() => input.current?.focus({ preventScroll: true })}>
      {out}{prompt()}{line}<span className="caret" />
      {/* Invisible input that receives the typing. It sits at the caret inside the
          scrolling .cmd box, so the browser never needs to scroll anything else. */}
      <input
        ref={input} value={line} spellCheck={false}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, left: 0, padding: 0, border: 0 }}
        onChange={(e) => setLine(e.target.value)}
        onKeyDown={keys}
      />
    </div>
  );
}
