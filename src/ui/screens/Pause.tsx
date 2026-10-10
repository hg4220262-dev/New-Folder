import { useState } from 'react';
import { store, useStore } from '../../engine/state';
import { Settings } from './Settings';

export function Pause() {
  useStore();
  const [settings, setSettings] = useState(false);
  if (!store.ui.pause) return null;
  const resume = () => { store.ui.pause = false; store.bump(); };
  return (
    <div className="pause-veil" onMouseDown={(e) => e.stopPropagation()}>
      {settings ? <Settings onClose={() => setSettings(false)} /> : (
        <>
          <h2>Paused</h2>
          <small>This is part of the game. None of your own files have been read or changed.</small>
          <button onClick={resume}>Resume</button>
          <button onClick={() => setSettings(true)}>Settings</button>
          <button onClick={() => { store.save(); store.ui.pause = false; store.s.phase = 'title'; store.s.windows = []; store.bump(); }}>Save and return to title</button>
          <button onClick={() => { store.save(); window.host?.quit(); }}>Save and quit</button>
        </>
      )}
    </div>
  );
}
