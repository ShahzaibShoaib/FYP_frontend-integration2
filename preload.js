// const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('electronAPI', {
//   chooseVideoFile: () => ipcRenderer.invoke('open-video-dialog'),
//   chooseSaveLocation: () => ipcRenderer.invoke('open-save-dialog'),
//   startEnhancement: (data) => ipcRenderer.send('enhance-video', data),
//   onEnhancementProgress: (callback) => ipcRenderer.on('enhancement-progress', callback),
// });
