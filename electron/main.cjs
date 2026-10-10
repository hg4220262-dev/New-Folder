// Electron entry point. Saves live in the app's own storage. The only file the game ever
// writes outside it is the short ending note left on the Desktop (see note.cjs).
// Window and Dock/menu-bar behaviour is in gamewindow.cjs.
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { leaveNote } = require('./note.cjs');
const gw = require('./gamewindow.cjs');

const DEBUG = process.argv.includes('--debug');
const TEST = process.argv.includes('--test');
// Automated runs get their own storage so they can never touch the player's save files.
if (TEST) app.setPath('userData', `${app.getPath('userData')}-test`);

function realName() {
  let full = '';
  try {
    if (process.platform === 'darwin') full = execFileSync('id', ['-F'], { timeout: 1000 }).toString().trim();
  } catch (_) { /* ignore */ }
  if (!full) { try { full = os.userInfo().username; } catch (_) { full = ''; } }
  const first = (full.split(/\s+/)[0] || 'User').replace(/[^\p{L}\p{N}' -]/gu, '');
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'User';
}

let win = null;
let quitting = false;

ipcMain.on('host-info', (e) => {
  e.returnValue = { name: realName(), debug: DEBUG, safeTop: TEST ? 0 : gw.safeTop() };
});
ipcMain.handle('capture', async (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return null;
  const img = await w.webContents.capturePage();
  return img.toDataURL();
});
ipcMain.handle('leave-note', async (_e, payload) => {
  if (TEST) return null; // automated runs never touch the real Desktop
  try { return await leaveNote(app.getPath('desktop'), payload); } catch { return null; }
});
ipcMain.on('quit', () => { quitting = true; app.quit(); });

function createWindow() {
  win = new BrowserWindow({
    width: TEST ? 1440 : 1280,
    height: TEST ? 900 : 800,
    show: false,
    backgroundColor: '#000000',
    title: 'New Folder',
    autoHideMenuBar: true,
    paintWhenInitiallyHidden: true,
    ...gw.windowOptions(TEST),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });
  // Block any navigation or pop-ups: the whole game lives in one page.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (ev) => ev.preventDefault());
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), { query: DEBUG ? { debug: '1' } : {} });

  if (!TEST) gw.keepInGameMode(win, () => quitting);
  win.once('ready-to-show', () => {
    if (TEST) return; // tests drive a hidden window
    gw.enterGameMode(win);
    win.show();
    win.focus();
  });
  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  // Minimal menu so Cmd+Q always quits and Cmd+H hides, like any game.
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: app.name, submenu: [{ role: 'hide' }, { role: 'hideOthers' }, { type: 'separator' }, { role: 'quit', label: 'Quit New Folder' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    ...(DEBUG ? [{ label: 'Debug', submenu: [{ role: 'toggleDevTools' }, { role: 'reload' }] }] : []),
  ]));
  createWindow();
});

// Back via Cmd+Tab or the Dock icon: show the window again, in game mode.
app.on('activate', () => {
  if (!win) { createWindow(); return; }
  if (win.isMinimized()) win.restore();
  win.show();
  if (!TEST) gw.enterGameMode(win);
});
app.on('did-become-active', () => { if (win && !TEST) gw.enterGameMode(win); });
app.on('before-quit', () => { quitting = true; gw.leaveGameMode(); });
app.on('window-all-closed', () => app.quit());
