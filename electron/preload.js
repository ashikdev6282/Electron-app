const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /* ----------- WINDOW / FLOW ----------- */

  openMainWindow: () => {
    ipcRenderer.send("open-main-window");
  },

  startRecorder: () => {
    ipcRenderer.send("start-recorder");
  },

  /* ----------- WINDOW CONTROLS ----------- */

  minimizeApp: () => {
    ipcRenderer.send("minimize-app");
  },

  toggleMaximize: () => {
    ipcRenderer.send("toggle-maximize");
  },

  closeFloating: () => {
    ipcRenderer.send("close-floating");
  },

  /* ----------- RECORDER SYNC (🔥 IMPORTANT) ----------- */

  recorderStart: () => ipcRenderer.send("recorder:start"),
  recorderStop: () => ipcRenderer.send("recorder:stop"),
  recorderPause: () => ipcRenderer.send("recorder:pause"),
  recorderResume: () => ipcRenderer.send("recorder:resume"),
  recorderReset: () => ipcRenderer.send("recorder:reset"),

  onRecorderUpdate: (callback) => {
    ipcRenderer.removeAllListeners("recorder:update"); // 🔥 VERY IMPORTANT
    ipcRenderer.on("recorder:update", (_, data) => {
      callback(data);
    });
  },

  /* ----------- AUDIO ----------- */

  getSystemAudioStream: async () => {
    return await ipcRenderer.invoke("get-system-audio");
  },

  saveAudio: async (buffer) => {
    ipcRenderer.send("save-audio", buffer);
  }
});