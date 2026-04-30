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
updateShortcuts: (keys) => {
  ipcRenderer.send("update-shortcuts", keys);
},

  onRecorderFinished: (callback) => {
  ipcRenderer.removeAllListeners("recorder:finished");
  ipcRenderer.on("recorder:finished", () => {
    callback();
  });
},


onTriggerSendFlow: (callback) => {
  ipcRenderer.removeAllListeners("trigger-send-flow");
  ipcRenderer.on("trigger-send-flow", () => {
    callback();
  });
},

onForceStop: (callback) => {
  ipcRenderer.removeAllListeners("force-stop-recorder");
  ipcRenderer.on("force-stop-recorder", () => callback());
},

onShowWarning: (callback) => {
  ipcRenderer.removeAllListeners("show-warning");
  ipcRenderer.on("show-warning", (_, msg) => callback(msg));
},



onNavigate: (callback) => {
  ipcRenderer.on("navigate", (_, route) => {
    callback(route);
  });
},

  setRecordedChunks: (chunks) => {
    ipcRenderer.send("set-recorded-chunks", chunks);
  },

  getRecordedChunks: () => {
    return ipcRenderer.invoke("get-recorded-chunks");
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




/* ================= 🎙 SHARED RECORDER ENGINE ================= */

let mediaRecorder = null;
let chunks = [];
let stream = null;
let isRecordingInternal = false;

async function startRecording() {
  try {
    if (isRecordingInternal) return;

    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 48000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.start(200);
    isRecordingInternal = true;

    ipcRenderer.send("recorder:start");
  } catch (err) {
    console.error("Start recording error:", err);
  }
}

async function stopRecording() {
  return new Promise((resolve) => {
    try {
      if (!mediaRecorder || !isRecordingInternal) {
        resolve([]);
        return;
      }

      mediaRecorder.onstop = async () => {
        const buffers = [];

        for (const chunk of chunks) {
          const arrayBuffer = await chunk.arrayBuffer();
          buffers.push(Array.from(new Uint8Array(arrayBuffer)));
        }

        // 🔥 Save globally
        ipcRenderer.send("set-recorded-chunks", buffers);

        // 🔥 Notify main process
        ipcRenderer.send("recorder:stop");

        // cleanup
        mediaRecorder = null;
        chunks = [];
        isRecordingInternal = false;

        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          stream = null;
        }

        resolve(buffers);
      };

      mediaRecorder.stop();
    } catch (err) {
      console.error("Stop recording error:", err);
      resolve([]);
    }
  });
}

contextBridge.exposeInMainWorld("sharedRecorder", {
  start: startRecording,
  stop: stopRecording,
});