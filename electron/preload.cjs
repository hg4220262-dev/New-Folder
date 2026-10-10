const { contextBridge, ipcRenderer } = require('electron');

const info = ipcRenderer.sendSync('host-info');

contextBridge.exposeInMainWorld('host', {
  name: info.name,
  debug: info.debug,
  safeTop: info.safeTop || 0,
  capture: () => ipcRenderer.invoke('capture'),
  leaveNote: (payload) => ipcRenderer.invoke('leave-note', payload),
  onFocus: (cb) => ipcRenderer.on('focus', (_e, v) => cb(!!v)),
  onSafeTop: (cb) => ipcRenderer.on('safe-top', (_e, v) => cb(Number(v) || 0)),
  quit: () => ipcRenderer.send('quit'),
});
