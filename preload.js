const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  convertHeic: (filePath) => ipcRenderer.invoke('convert-heic', filePath),
  getPathForFile: (file) => webUtils.getPathForFile(file)
});