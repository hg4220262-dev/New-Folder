import { useState } from 'react';
import { store } from '../../engine/state';
import { setVolume } from '../audio';

const Check = ({ on, dim, onClick, children }: { on: boolean; dim?: boolean; onClick: () => void; children: React.ReactNode }) => (
  <label className="hand" style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: dim ? 0.4 : 1 }} onClick={onClick}>
    <span style={{ width: 14, height: 14, border: '1px solid #888', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{on ? '✓' : ''}</span>{children}
  </label>
);

export function Settings({ onClose }: { onClose: () => void }) {
  const [, force] = useState(0);
  const st = store.settings;
  const set = (patch: Partial<typeof st>) => {
    Object.assign(store.settings, patch);
    if (patch.volume != null) setVolume(patch.volume);
    store.saveSettings();
    force((x) => x + 1);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', color: '#bbb', fontSize: 13, minWidth: 340 }}>
      <h2 style={{ fontWeight: 'normal', margin: '0 0 6px', alignSelf: 'center' }}>Settings</h2>
      <Check on={st.reduceFlashing} onClick={() => set({ reduceFlashing: !st.reduceFlashing })}>Reduce flashing (slower, softer breakdown effects)</Check>
      <Check on={st.reduceMotion} onClick={() => set({ reduceMotion: !st.reduceMotion })}>Reduce motion (no shaking, tilting or window trails)</Check>
      <Check on={st.deskNote} onClick={() => set({ deskNote: !st.deskNote })}>Let the story leave something on your Desktop when it ends</Check>
      <Check on={st.crt !== false} onClick={() => set({ crt: st.crt === false })}>CRT monitor look (scanlines, curved glass, glow)</Check>
      <Check on={st.crtCurve !== false} dim={st.crt === false} onClick={() => set({ crtCurve: st.crtCurve === false })}>Curved screen (turn off if the game feels slow)</Check>
      <Check on={st.oldLag !== false} onClick={() => set({ oldLag: st.oldLag === false })}>Old machine (a moment's wait when things open)</Check>
      <Check on={st.pauseOnBlur !== false} onClick={() => set({ pauseOnBlur: st.pauseOnBlur === false })}>Pause when you switch to another app</Check>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        Volume
        {[0, 0.25, 0.5, 0.7, 1].map((v) => (
          <span key={v} className="hand" onClick={() => set({ volume: v })}
            style={{ padding: '2px 8px', border: '1px solid #555', color: Math.abs(st.volume - v) < 0.01 ? '#fff' : '#777' }}>
            {v === 0 ? 'Off' : `${Math.round(v * 100)}%`}
          </span>
        ))}
      </div>
      <div className="hand" style={{ alignSelf: 'center', marginTop: 10, padding: '6px 24px', color: '#999' }} onClick={onClose}>Back</div>
    </div>
  );
}
