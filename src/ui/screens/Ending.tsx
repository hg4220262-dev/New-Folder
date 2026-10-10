import { store, ALL_ENDINGS, seenEndings } from '../../engine/state';
import { recap, CONCLUSION } from '../../story/recap';

const ENDINGS: Record<string, string[]> = {
  signoff: [
    'Review closed. 412 / 412.',
    'On Monday the boxes went to be pulped.',
    'The laptop was wiped and given to the next temp.',
    'Sometimes, when the lake is low, the chapel roof shows.',
    'Nobody looks for a number that adds up.',
  ],
  restore: [
    'Archive restored. 435 residents. 412 rehoused. 23 not accounted for.',
    'The Certificate is marked: disputed.',
    'The Continuity Service stopped. It did not argue.',
    'In its last journal entry it wrote: "Record 23 has a name now. That is enough."',
    'You never found out if it had been hiding them, or keeping them.',
  ],
  leave: [
    'You left the review open.',
    'Nothing was signed. Nothing was deleted.',
    'The laptop went back in the drawer, still running.',
    'Sometimes, months later, the hard disk light still blinks on its own.',
    'Somewhere on drive C, a school register is still being kept.',
  ],
  disclose: [
    'Board report released. 435 residents. 412 rehoused. 23 not moved.',
    'Wendell Utilities ended the Carrow contract the same week. The six boxes were not pulped.',
    'An inquiry into the closure of the gates at Nant Weir on 12 August 1979 was opened in 2008.',
    "Kell's statement of 2 March 1980 was read into the record of the inquiry, fourteen years after his death.",
    'Halden Records Services was not paid the final invoice of £41,000.',
  ],
  drain: [],
  recorded: [
    'Windows started normally. So did the HRS Continuity Service.',
    'Record 23 was finished at 03:15. Dunmore, {user}. 6 Mill Row.',
    'The archive now agrees with itself: 435 / 435.',
    'On Monday the laptop went back to Halden Records. Nobody could log on to it.',
    'The account on the Welcome screen had a different surname.',
  ],
  signed_early: [
    'Review closed. 412 / 412. Counts agree.',
    'The paper originals were destroyed on Monday.',
    'You were paid for two weeks. It was a straightforward job.',
    'Nothing on the laptop ever moved again.',
  ],
};

const NAMES = 'Ann, Thomas, Mary, Jack and Lily Pryce; George, Edith, Ruth and Peter Ellery; Walter, Iris and Owen Marsh; David, Carol, Susan and Paul Hollins; Harold and Joan Webb; Michael, Helen, Clare and Ian Dunmore, and an infant';

function Clipping() {
  const s = store.s;
  return (
    <div className="clipping">
      <div className="clip-head">HALDEN COURIER</div>
      <div className="clip-date">Friday 3 October 2008</div>
      <h2>TWENTY-THREE FOUND IN HOUSES AT CARROW</h2>
      <div className="clip-cols">
        <p>The remains of twenty-three people were recovered this week from six houses at Mill Row, Carrow, police said yesterday, after the level of Lake Wendell fell below Mill Row, the lowest part of the village, for the first time since the valley was flooded in August 1979.</p>
        <p>Police said all twenty-three were found on the upper floors. The Wendell Water Board's census of 1978 recorded 435 residents at Carrow. The Board's Evacuation Completion Certificate, signed on 12 August 1979, gave the figure as 412. {s.flags.assembledKell ? `A draft statement by the Board's engineer, Mr R. Kell, dated 2 March 1980 and seen by the Courier, names the twenty-three as ${NAMES}.` : "Wendell Utilities plc, the Board's successor, said it was examining the Board's records and could not yet account for the difference."}</p>
        <p>Wendell Utilities said the sluices at Nant Weir had been opened on 14 August by "an unauthorised remote session" and that the matter was with the police. A spokesman for Halden Records Services Ltd, which holds the Board's archive under contract, declined to comment.</p>
        <p className="clip-end">The Chairman of the Board in 1979, Mr H. Wendell-Price, died in 1996. An inquest is to be opened at Halden.</p>
      </div>
    </div>
  );
}

/** The whole window goes red. A few slow lines, then, after half a minute, a way back you have to look for. */
function RedEnd({ user, onReturn }: { user: string; onReturn: () => void }) {
  const lines = [
    `Record 23 removed (Dunmore, ${user}).`,
    '412 / 412. Counts agree.',
    'Unmatched: 0. Continued: 0.',
    'Reviewer: no record.',
    'HRS Continuity Service: not running.',
  ];
  return (
    <div className="screen red-end">
      {lines.map((l, i) => <div key={i} className="line" style={{ animationDelay: `${2 + i * 4.5}s` }}>{l}</div>)}
      <div className="line ret hand" style={{ animationDelay: '30s' }} onClick={onReturn}>return</div>
    </div>
  );
}

export function Ending() {
  const s = store.s;
  const id = s.ending ?? 'signed_early';
  let lines = (ENDINGS[id] ?? ENDINGS.signed_early).map((l) => l.replace('{user}', s.user));
  if (id === 'disclose' && s.flags.assembledKell) lines = [...lines.slice(0, 3), "The twenty-three were named at the inquiry, from the list in Kell's draft.", ...lines.slice(3)];
  // The finished file is kept; it shows as complete on the file-select screen.
  const restart = () => { s.windows = []; s.screenMode = 'boxed'; store.save(); s.phase = 'title'; store.bump(); };
  if (id === 'erase') return <RedEnd user={s.user} onReturn={restart} />;
  const done = recap(s);
  const t0 = id === 'drain' ? 4.5 : 1.2 + lines.length * 2.6;
  const t1 = t0 + 1.5 + done.length * 0.35;
  const record = (
    <div className="line recap" style={{ animationDelay: `${t0}s` }}>
      <div className="recap-head">Reviewer record: {s.fullName}</div>
      {done.map((l, i) => <div key={i} className="line" style={{ animationDelay: `${t0 + 0.6 + i * 0.35}s` }}>{l}</div>)}
    </div>
  );
  return (
    <div className={`screen ending ${id === 'drain' ? 'drain' : ''}`}>
      {id === 'drain'
        ? <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}><div className="line" style={{ animationDelay: '0.8s' }}><Clipping /></div>{record}</div>
        : <>{lines.map((l, i) => <div key={i} className="line" style={{ animationDelay: `${0.8 + i * 2.6}s` }}>{l}</div>)}{record}</>}
      <div className="line conclusion" style={{ animationDelay: `${t1}s` }}>{CONCLUSION[id]}</div>
      <div className="line" style={{ animationDelay: `${t1 + 2.5}s`, marginTop: 14, color: '#555', fontSize: 12 }}>
        New Folder. Thank you for playing.
        <div style={{ marginTop: 4 }}>Endings found: {seenEndings().length} of {ALL_ENDINGS.length}</div>
        {id === 'signed_early' && <div>There was more on that laptop than the review asked for.</div>}
        {id === 'recorded' && <div>The service did not load in one of the startup options.</div>}
      </div>
      <div className="line" style={{ animationDelay: `${t1 + 3.5}s`, display: 'flex', gap: 20 }}>
        <span className="end-opt hand" onClick={restart}>Return to title</span>
        <span className="end-opt hand" onClick={() => window.host?.quit()}>Quit</span>
      </div>
    </div>
  );
}
