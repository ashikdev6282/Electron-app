const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openMainWindow: () => ipcRenderer.send("open-main-window"),
  getSystemAudioStream: () => ipcRenderer.invoke("get-system-audio")
});