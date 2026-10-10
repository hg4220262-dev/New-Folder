import { store } from '../../engine/state';
import { hrsLog, journalLine } from '../../engine/director';
import { dialog, closeWin } from '../../engine/windows';
import { HSC_HOST } from '../../story/storage';
import type { Win } from '../../engine/types';
import { Group } from './widgets';
import { POLICIES } from '../../story/policy';

/** The Administrator's view of the HRS Continuity Service. */
export function Console({ win }: { win: Win }) {
  const s = store.s;
  const filterOff = !!s.flags.webUnblocked;
  const rack = !!s.flags.rack2On;
  const toggleFilter = () => {
    s.flags.webUnblocked = !filterOff;
    hrsLog(`Web filter switched ${filterOff ? 'on' : 'off'} from the Service Console.`, 'Warning');
    store.bump();
  };
  const cycleRack = () => {
    if (rack) return;
    s.flags.rack2On = true;
    hrsLog('Rack 2 switch power-cycled from the Service Console.', 'Warning');
    journalLine('Administrator restored Rack 2.\nThe pieces are no longer kept apart.');
    store.bump();
  };
  return (
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
      <Group title="Service">
        <div className="props-row"><span>Status:</span><span>RUNNING (hrscont.exe)</span></div>
        <div className="props-row"><span>Mode:</span><span>{s.chapter >= 5 ? 'PROTECT' : 'HARMONISE'}</span></div>
        <div className="props-row"><span>Reviewer:</span><span>{s.fullName}</span></div>
        <div className="props-row"><span>Sign-off:</span><span>PENDING</span></div>
      </Group>
      <Group title="Web filter">
        <div className="props-row"><span>State:</span><span>{filterOff ? 'OFF' : 'ON'}</span></div>
        <button className="btn" onClick={toggleFilter}>{filterOff ? 'Switch on' : 'Switch off'}</button>
      </Group>
      <Group title="Reviewer account restrictions">
        {Object.entries(POLICIES).map(([k, p]) => {
          const allowed = !!s.flags[`allow_${k}`];
          return (
            <div key={k} className="props-row"><span>{p.label}:</span><span>{allowed ? 'Allowed' : 'Blocked'}{' '}
              <button className="btn" style={{ minWidth: 70, height: 21 }} onClick={() => { s.flags[`allow_${k}`] = !allowed; hrsLog(`${p.label} ${allowed ? 'blocked' : 'allowed'} for the reviewer account.`, 'Warning'); store.bump(); }}>{allowed ? 'Block' : 'Allow'}</button></span></div>
          );
        })}
      </Group>
      <Group title="Storage cluster link">
        <div className="props-row"><span>NameNode:</span><span>{HSC_HOST}</span></div>
        <div className="props-row"><span>Rack 2:</span><span>{rack ? 'Online' : 'Switch not responding'}</span></div>
        <button className="btn" disabled={rack} onClick={cycleRack}>Power-cycle Rack 2 switch</button>
      </Group>
      <Group title="Public record">
        <div className="props-row"><span>Board report:</span><span>{s.flags.assembled ? 'Joined' : 'Not joined'}</span></div>
        <button className="btn" disabled={!s.flags.assembled} onClick={() => dialog('Release Board Report', 'Release the joined Board report to the public record?\n\nThis will be seen by the Board\'s successor and cannot be undone.', 'warn', ['Publish', 'Cancel'], 'release_confirm')}>Release to public record...</button>
      </Group>
      <div className="dlg-btns" style={{ justifyContent: 'flex-end', padding: 0 }}><button className="btn default" onClick={() => closeWin(win.id)}>Close</button></div>
    </div>
  );
}
