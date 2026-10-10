import { useEffect } from 'react';
import { store, useStore } from '../../engine/state';
import { BRAND } from '../../brand';
import { WinFlag } from '../icons';
import { PowerGlyph, KeyGlyph } from './StartMenu';
import { leave, cancelAsk } from '../screens/session';

const Big = ({ color, label, onClick, children }: { color: string; label: string; onClick: () => void; children: React.ReactNode }) => (
  <div className="sd-opt hand" onClick={onClick}>
    <span className="sd-btn" style={{ background: color }}>{children}</span>
    <span>{label}</span>
  </div>
);

const Restart = () => (
  <svg width="22" height="22" viewBox="0 0 14 14"><path d="M10.6 4.2A4.4 4.4 0 1 0 11.4 8" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" /><path d="M8.2 3.8h3V0.9" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" /></svg>
);

/** The whole desktop drains to grey while the prompt is up, then fades out when leaving. */
export function ShutdownPrompt() {
  useStore();
  const ask = store.ui.ask, leaving = store.ui.leaving;
  useEffect(() => {
    if (!ask) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); cancelAsk(); } };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [ask]);
  if (!ask && !leaving) return null;
  return (
    <div className={`sd-veil ${leaving ? 'out' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
      {ask && (
        <div className="sd-box">
          <div className="sd-head"><span>{ask === 'off' ? 'Turn off computer' : `Log Off ${BRAND.osName}`}</span><WinFlag size={30} /></div>
          <div className="sd-mid">
            {ask === 'off' ? (
              <>
                <Big color="linear-gradient(135deg,#f6c855,#d39014)" label="Stand By" onClick={() => {}}><PowerGlyph size={22} /></Big>
                <Big color="linear-gradient(135deg,#f08a4b,#c2410b)" label="Turn Off" onClick={() => leave('off')}><PowerGlyph size={22} /></Big>
                <Big color="linear-gradient(135deg,#6cc36c,#2c8a2c)" label="Restart" onClick={() => leave('restart')}><Restart /></Big>
              </>
            ) : (
              <>
                <Big color="linear-gradient(135deg,#6ca6f0,#2a5bd7)" label="Switch User" onClick={() => leave('logoff')}><KeyGlyph size={22} /></Big>
                <Big color="linear-gradient(135deg,#f6c855,#d39014)" label="Log Off" onClick={() => leave('logoff')}><KeyGlyph size={22} /></Big>
              </>
            )}
          </div>
          <div className="sd-foot"><button className="btn" onClick={cancelAsk}>Cancel</button></div>
        </div>
      )}
    </div>
  );
}
