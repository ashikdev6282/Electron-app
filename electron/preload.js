const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /* ----------- WINDOW / FLOW ----------- */

  openMainWindow: (type = "normal") => {
    ipcRenderer.send("open-main-window", type);
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
  recorderForceStop: () => ipcRenderer.send("recorder:force-stop"),

  onRecorderUpdate: (callback) => {
    ipcRenderer.removeAllListeners("recorder:update"); // prevent duplicates
    ipcRenderer.on("recorder:update", (_, data) => {
      callback(data);
    });
  },

  /* ----------- ⌨ GLOBAL SHORTCUTS ----------- */

  onShortcut: (callback) => {
    ipcRenderer.removeAllListeners("shortcut:record");
    ipcRenderer.removeAllListeners("shortcut:stop");
    ipcRenderer.removeAllListeners("shortcut:send");

    ipcRenderer.on("shortcut:record", () => callback("record"));
    ipcRenderer.on("shortcut:stop", () => callback("stop"));
    ipcRenderer.on("shortcut:send", () => callback("send"));
  },

  onRecorderFinished: (callback) => {
    ipcRenderer.on("recorder:finished", () => {
      callback();
    });
  },

  onTriggerSendFlow: (callback) => {
    ipcRenderer.on("trigger-send-flow", () => {
      callback();
    });
  },

  onNavigate: (callback) => {
    ipcRenderer.on("navigate", (_, route) => {
      callback(route);
    });
  },
  
  onForceStop: (callback) => {
  ipcRenderer.removeAllListeners("force-stop-recorder");
  ipcRenderer.on("force-stop-recorder", () => callback());
},

  setRecordedChunks: (chunks) => {
    ipcRenderer.send("set-recorded-chunks", chunks);
  },

  getRecordedChunks: async () => {
    const chunks = await ipcRenderer.invoke("get-recorded-chunks");

    if (!chunks) return [];

    // 🔥 ensure consistent format
    return chunks.map((chunk) => new Uint8Array(chunk));
  },

  clearRecordedChunks: () => {
    ipcRenderer.send("clear-recorded-chunks");
  },

  /* ----------- 🔐 LOGIN API ----------- */

  login: async (credentials) => {
    try {
      return await ipcRenderer.invoke("login", credentials);
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: err.message };
    }
  },

  /* ----------- 📤 AUDIO UPLOAD API ----------- */

  uploadAudio: async ({ fileBuffer, fileName, priority, comment }) => {
    try {
      return await ipcRenderer.invoke("upload-audio", {
        fileBuffer: Array.from(new Uint8Array(fileBuffer)),
        fileName,
        priority,
        comment,
      });
    } catch (err) {
      console.error("Upload error:", err);
      return { success: false, message: err.message };
    }
  },

  /* ----------- AUDIO SYSTEM ----------- */

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
