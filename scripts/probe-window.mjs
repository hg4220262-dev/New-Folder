// Launches the real (non-test) build for a few seconds and reports how the game window
// sits on the display: Dock/menu bar presentation, bounds, focus. Then quits.
import { _electron as electron } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = await electron.launch({
  executablePath: path.join(root, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'),
  args: [root],
});
await app.firstWindow();
await new Promise((r) => setTimeout(r, 2500));
const addon = path.join(root, 'electron/native/presentation.node');
const report = await app.evaluate(({ BrowserWindow, screen }, file) => {
  const w = BrowserWindow.getAllWindows()[0];
  const d = screen.getDisplayMatching(w.getBounds());
  let native = null;
  try {
    // Same module instance the app loaded (require cache), so this reads the live state.
    const n = process.mainModule.require(file);
    native = { gameMode: n.isGameMode(), safeTop: n.safeTop() };
  } catch (e) { native = String(e); }
  return {
    bounds: w.getBounds(), display: d.bounds, workArea: d.workArea,
    simpleFullScreen: w.isSimpleFullScreen(), fullScreen: w.isFullScreen(),
    visible: w.isVisible(), focused: w.isFocused(), native,
  };
}, addon);
console.log('launch', JSON.stringify(report));

// App switching: hand focus to Finder (like Cmd+Tab), then come back.
const { execFileSync } = await import('node:child_process');
const state = () => app.evaluate(({ BrowserWindow, app: a }, file) => {
  const w = BrowserWindow.getAllWindows()[0];
  const n = process.mainModule.require(file);
  return { focused: w.isFocused(), visible: w.isVisible(), gameMode: n.isGameMode(), bounds: w.getBounds() };
}, addon);
const page = await app.firstWindow();
// Pausing only applies in play, so put the game on its desktop first.
// This runs as the real app, so never let it write a save file.
await page.evaluate(() => { const s = window.__game.store; s.save = () => {}; s.s.phase = 'desktop'; s.bump(); });
await new Promise((r) => setTimeout(r, 500));
execFileSync('osascript', ['-e', 'tell application "Finder" to activate']);
await new Promise((r) => setTimeout(r, 1500));
console.log('after switching away', JSON.stringify(await state()));
console.log('game paused itself', await page.evaluate(() => window.__game.store.ui.pause));
await app.evaluate(({ app: a, BrowserWindow }) => { a.focus({ steal: true }); BrowserWindow.getAllWindows()[0].focus(); });
await new Promise((r) => setTimeout(r, 1500));
console.log('after switching back', JSON.stringify(await state()));
await app.close();
