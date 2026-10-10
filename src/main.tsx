import { createRoot } from 'react-dom/client';
import './ui/styles/base.css';
import './ui/styles/window.css';
import './ui/styles/shell.css';
import './ui/styles/explorer.css';
import './ui/styles/apps.css';
import './ui/styles/screens.css';
import { store } from './engine/state';
import { titleState } from './ui/screens/session';
import { installPointer } from './ui/pointer';
import { initAudio } from './ui/audio';
import { App } from './ui/App';
import { preloadPhotos } from './ui/art/render';

// Browser fallback for `npm run dev` (outside Electron).
if (!window.host) {
  window.host = { name: 'User', debug: new URLSearchParams(location.search).has('debug'), capture: async () => null, quit: () => {} };
}

store.migrate();
store.s = titleState();
installPointer();
initAudio();
window.addEventListener('beforeunload', () => store.save());

// Exposed for automated screenshot tests only.
(window as any).__game = { store };

preloadPhotos().then(() => createRoot(document.getElementById('root')!).render(<App />));
