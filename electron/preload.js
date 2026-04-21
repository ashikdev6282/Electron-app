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

  /* ----------- RECORDER SYNC ----------- */

  recorderStart: () => ipcRenderer.send("recorder:start"),
  recorderStop: () => ipcRenderer.send("recorder:stop"),
  recorderPause: () => ipcRenderer.send("recorder:pause"),
  recorderResume: () => ipcRenderer.send("recorder:resume"),
  recorderReset: () => ipcRenderer.send("recorder:reset"),

  onRecorderUpdate: (callback) => {
    ipcRenderer.removeAllListeners("recorder:update"); // prevent duplicate listeners
    ipcRenderer.on("recorder:update", (_, data) => {
      callback(data);
    });
  },

  /* ----------- 🔐 LOGIN API (NEW) ----------- */

  login: async (credentials) => {
    try {
      return await ipcRenderer.invoke("login", credentials);
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  /* ----------- AUDIO ----------- */

  getSystemAudioStream: async () => {
    try {
      return await ipcRenderer.invoke("get-system-audio");
    } catch (err) {
      console.error("Audio stream error:", err);
      return null;
    }
  },

  saveAudio: (buffer) => {
    ipcRenderer.send("save-audio", buffer);
  },
});