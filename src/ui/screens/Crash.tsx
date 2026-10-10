import { useEffect, useRef, useState } from 'react';
import { store } from '../../engine/state';
import { sfx } from '../../engine/bus';
import { toReboot, toRecovery, bootChoice, assistantWins } from '../../story/climax';
import { BOOT_LABEL, TRIES, actLines, options, reshuffle, round, rows, type BootOpt } from '../../story/race';
import { MILL_ROW } from '../../story/people';
import { BRAND } from '../../brand';

/** Stop error. Rendered in full-screen mode, so it spans the ENTIRE real display. */
export function Crash() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct((p) => Math.min(100, p + 5)), 260);
    const done = setTimeout(toReboot, 8200);
    return () => { clearInterval(t); clearTimeout(done); };
  }, []);
  return (
    <div className="screen bsod">{`A problem has been detected and ${BRAND.osName} has been shut down to prevent damage
to your computer.

RECORD_CONTINUITY_VIOLATION

If this is the first time you've seen this Stop error screen,
restart your computer. If this screen appears again, follow
these steps:

Check to make sure any new hardware or software is properly installed.
If this is a new installation, ask your hardware or software manufacturer
for any Windows updates you might need.

If problems continue, do not close the review.

Technical information:

*** STOP: 0x000001B3 (0x00000435, 0x0000019C, 0x00000017, 0x12081979)

***  hrscont.exe - Address F7A1C0DE base at F7A10000, DateStamp 12081979

Beginning dump of physical memory
Dumping physical memory to disk:  ${String(pct).padStart(3)}`}
      {pct >= 100 && '\nPhysical memory dump complete.\nContact your system administrator or technical support group for further\nassistance.'}
    </div>
  );
}

const INTRO = 'We apologize for the inconvenience, but Windows did not start successfully. A\nrecent hardware or software change might have caused this.\n\nIf your computer stopped responding, restarted unexpectedly, or was\nautomatically shut down to protect your files and folders, choose Last Known\nGood Configuration to revert to the most recent settings that worked.\n\nUse the up and down arrow keys to highlight your choice.\n\n';

type Stage = 'black' | 'menu' | 'act' | 'chk';

/**
 * Black reboot screen: the error-recovery menu as a race against the HRS Archive
 * Assistant (rules in story/race.ts), then the disk check. All full width.
 */
export function Reboot() {
  const s = store.s;
  const [stage, setStage] = useState<Stage>(() => (s.flags.raceWon ? 'chk' : 'black'));
  const [losses, setLosses] = useState<number>(() => Math.min(TRIES - 1, s.flags.raceLosses ?? 0));
  const [order, setOrder] = useState<BootOpt[]>(() => options(round(losses)));
  const [sel, setSel] = useState<BootOpt>('normal');
  const [left, setLeft] = useState(() => round(losses).ms);
  const [say, setSay] = useState<string | null>(null);
  const [redraw, setRedraw] = useState(false);
  const [skip, setSkip] = useState(false);
  const [out, setOut] = useState<string[]>([]);
  const [shown, setShown] = useState(0);
  const [chk, setChk] = useState<string[]>([]);
  /** Input is ignored until this time (the assistant is redrawing the menu). */
  const lock = useRef(0);
  /** A choice has been made for this try. */
  const done = useRef(false);
  const timers = useRef<number[]>([]);
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)); };
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  // Resumed after the last try was already lost: the assistant has its way.
  useEffect(() => { if (!s.flags.raceWon && (s.flags.raceLosses ?? 0) >= TRIES) assistantWins(); }, []);

  const choose = (opt: BootOpt | null) => {
    if (done.current || store.ui.pause) return;
    if (opt && performance.now() < lock.current) return;
    done.current = true;
    const res = bootChoice(opt);
    if (res === 'win') { sfx('click'); setStage('chk'); return; }
    sfx('error');
    setOut(actLines(opt, store.s.user, store.s.flags.raceLosses ?? TRIES));
    setShown(0);
    setStage('act');
  };

  // Black screen, then a fresh try. Retries come back faster.
  useEffect(() => {
    if (stage !== 'black') return;
    const t = setTimeout(() => {
      const r = round(losses);
      setOrder(options(r)); setSel('normal'); setLeft(r.ms); setSay(null); setRedraw(false); setSkip(false);
      done.current = false;
      lock.current = 0;
      setStage('menu');
      sfx('beep');
    }, losses ? 1400 : 2600);
    return () => clearTimeout(t);
  }, [stage, losses]);

  // The countdown, and the assistant pulling the choice its way. Frozen while paused.
  useEffect(() => {
    if (stage !== 'menu') return;
    const r = round(losses);
    let remaining = r.ms;
    let elapsed = 0;
    let nextTug = r.tugMs * 0.6;
    let n = 0;
    let lastSec = Math.ceil(remaining / 1000);
    let last = performance.now();
    const calm = store.settings.reduceFlashing || store.settings.reduceMotion;
    const tug = () => {
      // The assistant speaks with its balloon chime; later it stops being polite.
      sfx(r.shuffle ? 'glitch' : 'balloon');
      setSay(r.lines[n++ % r.lines.length]);
      setSel(r.pick);
      if (r.shuffle) {
        setOrder((o) => reshuffle(o));
        lock.current = performance.now() + 320;
        if (!calm) { setRedraw(true); later(220, () => setRedraw(false)); }
      }
      if (r.skip) {
        remaining -= 1000;
        if (!calm) { setSkip(true); later(260, () => setSkip(false)); }
      }
    };
    const id = setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      if (store.ui.pause || done.current) return;
      remaining -= dt;
      elapsed += dt;
      if (elapsed >= nextTug && remaining > 1500) { nextTug += r.tugMs; tug(); }
      if (remaining <= 0) { setLeft(0); choose(null); return; }
      const sec = Math.ceil(remaining / 1000);
      if (sec !== lastSec) { lastSec = sec; if (sec <= 5) sfx('beep'); }
      setLeft(remaining);
    }, 100);
    return () => clearInterval(id);
  }, [stage, losses]);

  useEffect(() => {
    if (stage !== 'menu') return;
    const key = (e: KeyboardEvent) => {
      if (store.ui.pause) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const step = e.key === 'ArrowUp' ? -1 : 1;
        setSel((v) => order[Math.max(0, Math.min(order.length - 1, order.indexOf(v) + step))] ?? v);
      }
      if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [stage, sel, order]);

  // The assistant chose: print what it started, then restart (or finish the record).
  useEffect(() => {
    if (stage !== 'act') return;
    const lost = (store.s.flags.raceLosses ?? 0) >= TRIES;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setShown(i);
      if (i % 2 === 0) sfx('hddseek');
      if (i >= out.length) {
        clearInterval(t);
        later(lost ? 2800 : 2000, () => {
          if (lost) { assistantWins(); return; }
          setLosses(Math.min(TRIES - 1, store.s.flags.raceLosses ?? 0));
          setStage('black');
        });
      }
    }, 180);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'chk') return;
    const names = MILL_ROW.map((p) => `${p.surname}, ${p.forename === '(infant)' ? store.s.user : p.forename}`);
    const lines = [
      'Checking file system on C:', 'The type of the file system is NTFS.', '',
      'One of your disks needs to be checked for consistency. You', 'may cancel the disk check, but it is strongly recommended', 'that you continue.', '',
      'CHKDSK is verifying files (stage 1 of 3)...',
      ...names.map((n, i) => `Deleting index entry ${String(412 + i + 1).padStart(4, '0')}  ${n.padEnd(22)} ... record continued.`),
      'File verification completed.', 'CHKDSK is verifying indexes (stage 2 of 3)...',
      'Correcting error in index $I30 for file 1979.', 'Index verification completed.',
      'CHKDSK is recovering lost files.', 'Recovering orphaned file ~unmatched (23) into directory C:\\.', '',
      'Windows has made corrections to the file system.', '',
      'Starting Windows in Safe Mode...',
      'HRS Continuity Service (hrscont.exe): not loaded in Safe Mode.',
    ];
    let i = 0;
    const t = setInterval(() => {
      i++;
      setChk(lines.slice(0, i));
      if (i % 3 === 0) sfx('hddseek');
      if (i >= lines.length) { clearInterval(t); later(2600, toRecovery); }
    }, 210);
    return () => clearInterval(t);
  }, [stage]);

  if (stage === 'black') return <div className="screen" style={{ background: '#000' }} />;
  if (stage === 'chk') return <div className="screen chkdsk">{chk.slice(-34).join('\n')}</div>;
  if (stage === 'act') return <div className="screen recovery-menu">{out.slice(0, shown).join('\n')}</div>;
  const secs = Math.max(0, Math.ceil(left / 1000));
  return (
    <div className="screen recovery-menu">
      {INTRO}
      {rows(order).map((o, i) => (o ? (
        <div key={o} className={`ro hand ${o === sel ? 'hl' : ''} ${redraw ? 'redraw' : ''}`}
          onMouseEnter={() => setSel(o)}
          onMouseDown={(e) => { e.preventDefault(); choose(o); }}>{BOOT_LABEL[o]}</div>
      ) : <div key={`gap${i}`}>{' '}</div>))}
      {'\n'}
      <div>Seconds until Windows starts: <span className={`secs ${skip ? 'skip' : ''}`}>{secs}</span></div>
      {say && <div className="assist">{'\n'}HRS Archive Assistant: {say}</div>}
      {losses > 0 && <div className="rec">{'\n'}Record 23: Dunmore, {s.user} ... {losses} of {TRIES}</div>}
    </div>
  );
}
