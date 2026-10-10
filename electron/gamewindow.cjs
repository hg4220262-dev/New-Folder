// Window behaviour, modelled on how Steam games run on macOS: a borderless window that
// covers the whole display, with the Dock and menu bar HIDDEN (not auto-hidden) while the
// game is frontmost. Cmd+Tab and other app switching keep working; macOS shows the Dock
// and menu bar again for other apps and hides them on return. Only quitting ends it.
const { screen } = require('electron');

const MAC = process.platform === 'darwin';
let native = null;
if (MAC) {
  try { native = require('./native/presentation.node'); } catch { native = null; }
}

/** Notch height in points on the main display (0 without one). */
function safeTop() {
  try { return native ? Math.round(native.safeTop()) : 0; } catch { return 0; }
}

/** Cover the whole display the window is on, edge to edge. */
function coverDisplay(w) {
  if (!w || w.isDestroyed()) return;
  const d = screen.getDisplayMatching(w.getBounds());
  w.setBounds(d.bounds, false);
}

function enterGameMode(w) {
  if (!w || w.isDestroyed()) return;
  if (!MAC) { if (!w.isFullScreen()) w.setFullScreen(true); return; }
  let hidden = false;
  if (native) {
    try { native.setGameMode(true); hidden = native.isGameMode(); } catch { hidden = false; }
  }
  // Without the helper, fall back to Electron's simple full screen (Dock/menu auto-hide).
  if (hidden) coverDisplay(w);
  else if (!w.isSimpleFullScreen()) w.setSimpleFullScreen(true);
}

function leaveGameMode() {
  if (native) { try { native.setGameMode(false); } catch { /* ignore */ } }
}

/** Options for the BrowserWindow constructor. */
function windowOptions(test) {
  return {
    frame: test,
    resizable: test,
    movable: test,
    maximizable: false,
    fullscreenable: !MAC || test, // never the green-button Space: we cover the display ourselves
    hasShadow: false,
    roundedCorners: false,
    enableLargerThanScreen: true,
  };
}

/** Keep the window in game mode for its whole life. */
function keepInGameMode(w, isQuitting) {
  const again = () => { if (!isQuitting()) setTimeout(() => enterGameMode(w), 50); };
  w.on('leave-full-screen', again);
  w.on('restore', again);
  w.on('focus', () => { enterGameMode(w); w.webContents.send('focus', true); });
  w.on('blur', () => { if (!w.isDestroyed()) w.webContents.send('focus', false); });
  const refit = () => { if (!w.isDestroyed()) { enterGameMode(w); w.webContents.send('safe-top', safeTop()); } };
  screen.on('display-metrics-changed', refit);
  screen.on('display-removed', refit);
  screen.on('display-added', refit);
  w.on('closed', () => {
    screen.removeListener('display-metrics-changed', refit);
    screen.removeListener('display-removed', refit);
    screen.removeListener('display-added', refit);
  });
}

module.exports = { enterGameMode, leaveGameMode, windowOptions, keepInGameMode, safeTop };
