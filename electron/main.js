const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
  desktopCapturer,
  screen,
  globalShortcut,
} = require("electron");

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// 🔥 Define both paths
const prodPath = path.join(process.resourcesPath, ".env");
const devPath = path.join(__dirname, "../.env");

// 🔥 Pick whichever exists
const envPath = fs.existsSync(prodPath) ? prodPath : devPath;

// 🔥 Load ENV
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("✅ ENV LOADED FROM:", envPath);
  console.log("🔥 TRANSACTION_ID:", process.env.TRANSACTION_ID);
} else {
  console.error("❌ ENV FILE NOT FOUND:", envPath);
}

let mainWindow = null;
let floatingWindow = null;
let isUserLoggedIn = false;

/* 🔥 GLOBAL AUDIO STORAGE */
let recordedChunksGlobal = [];

const isDev = !app.isPackaged;

/* ---------------- GLOBAL RECORDER STATE ---------------- */
let recorderState = {
  isRecording: false,
  isPaused: false,
  seconds: 0,
};

let timerInterval = null;
let startTime = null;
let pauseTime = null;

/* 🔁 BROADCAST STATE */
function broadcastRecorderState() {
  if (mainWindow) {
    mainWindow.webContents.send("recorder:update", recorderState);
  }
  if (floatingWindow) {
    floatingWindow.webContents.send("recorder:update", recorderState);
  }
}

/* ---------------- MAIN WINDOW ---------------- */
function createMainWindow() {
  if (mainWindow) return;

  const { workArea } = screen.getPrimaryDisplay();

  const winWidth = 400;
  const winHeight = 700;

  const MARGIN_RIGHT = 20;
  const MARGIN_BOTTOM = 60;

  mainWindow = new BrowserWindow({
    title: "Medrec-Q Dictate",
    width: winWidth,
    height: winHeight,
    x: workArea.x + workArea.width - winWidth - MARGIN_RIGHT,
    y: workArea.y + workArea.height - winHeight - MARGIN_BOTTOM,
    minWidth: 350,
    minHeight: 600,
    show: false,
    backgroundColor: "#0f0f0f",
    resizable: true,
    minimizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../ui/dist/index.html"));
  }

  mainWindow.setMenu(null);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    broadcastRecorderState();
  });

  mainWindow.on("minimize", (e) => {
    // ❌ NOT LOGGED IN → normal minimize (NO floating)
    if (!isUserLoggedIn) {
      mainWindow.minimize(); // real minimize
      return;
    }
    // 🚫 BLOCK when recording
    if (recorderState.isRecording) {
      e.preventDefault();

      mainWindow.webContents.send(
        "show-warning",
        "Stop recording before minimizing",
      );

      return;
    }

    // ✅ NORMAL FLOW (your existing behavior)
    mainWindow.hide();

    if (!floatingWindow) createFloatingWindow();

    floatingWindow.show();
    floatingWindow.focus();

    broadcastRecorderState();
  });

  mainWindow.on("close", () => {
    app.isQuiting = true;
    app.quit();
  });
}

/* ---------------- FLOATING WINDOW ---------------- */
function createFloatingWindow() {
  if (floatingWindow) return;

  const { workArea } = screen.getPrimaryDisplay();

  const floatWidth = 260;
  const floatHeight = 70;

  const MARGIN_RIGHT = 20;
  const MARGIN_BOTTOM = 80;

  floatingWindow = new BrowserWindow({
    title: "Medrec-Q Dictate",
    width: floatWidth,
    height: floatHeight,
    x: workArea.x + workArea.width - floatWidth - MARGIN_RIGHT,
    y: workArea.y + workArea.height - floatHeight - MARGIN_BOTTOM,
    frame: false,
    backgroundColor: "#111111",
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    floatingWindow.loadURL("http://localhost:5173#mini");
  } else {
    floatingWindow.loadFile(path.join(__dirname, "../ui/dist/index.html"), {
      hash: "mini",
    });
  }

  floatingWindow.once("ready-to-show", () => {
    floatingWindow.show();
    floatingWindow.focus();
    broadcastRecorderState();
  });

  floatingWindow.on("close", () => {
    app.isQuiting = true;
    app.quit();
  });

  floatingWindow.on("closed", () => {
    floatingWindow = null;
  });
}

/* ---------------- APP READY ---------------- */
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createMainWindow();

  /*  GLOBAL SHORTCUTS */

  globalShortcut.unregisterAll(); // 🔥 important to avoid duplicate

  // 🎙 F8 → Record / Stop (toggle)
  globalShortcut.register("F8", () => {
    mainWindow?.webContents.send("shortcut:record");
    floatingWindow?.webContents.send("shortcut:record");
  });

  // 📤 F9 → Send
  globalShortcut.register("F9", () => {
    mainWindow?.webContents.send("shortcut:send");
    floatingWindow?.webContents.send("shortcut:send");
  });
});

/* ---------------- WINDOW FLOW ---------------- */

ipcMain.on("start-recorder", () => {
  if (!floatingWindow) createFloatingWindow();

  if (mainWindow) mainWindow.hide();

  floatingWindow.show();
  floatingWindow.focus();
});

ipcMain.on("open-main-window", (event, type = "normal") => {
  if (floatingWindow) floatingWindow.hide();

  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();

    // 🔥 DO NOT reload the app
    mainWindow.webContents.send("navigate", "dictate");

    if (type === "send") {
      mainWindow.webContents.send("trigger-send-flow");
    }

    // 🔥 force sync after open
    setTimeout(() => {
      mainWindow.webContents.send("recorder:finished");
    }, 100);

    broadcastRecorderState();
  }
});

/* ---------------- LOGIN API ---------------- */

ipcMain.handle("login", async (event, credentials) => {
  try {
    const response = await fetch("https://www.medrecq.com/api/login.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Transaction-ID": (process.env.TRANSACTION_ID || "").trim(),
      },
      body: JSON.stringify(credentials),
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, message: "Invalid server response" };
    }

    if (data.success) {
      global.userSession = data.data;
      isUserLoggedIn = true;
    } else {
      return { success: false, message: data.message };
    }

    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

/* ---------------- AUDIO API ---------------- */

ipcMain.handle("upload-audio", async (event, payload) => {
  try {
    const { fileBuffer, fileName, priority, comment } = payload;

    if (!global.userSession?.token) {
      return { success: false, message: "Session expired" };
    }

    const buffer = Buffer.from(fileBuffer);

    const blob = new Blob([buffer], {
      type: "audio/wav",
    });

    const form = new FormData();

    const safeFileName = fileName.endsWith(".wav")
      ? fileName
      : fileName + ".wav";

    form.append("upload_priority", priority || "normal");
    form.append("comment", comment || "");
    form.append("files[]", blob, safeFileName);

    const response = await fetch(
      "https://www.medrecq.com/api/upload-audio.php",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${global.userSession.token}`,
          "X-Transaction-ID": process.env.TRANSACTION_ID,
        },
        body: form,
      },
    );

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      console.error("INVALID RESPONSE:", text);
      return { success: false, message: "Invalid server response" };
    }
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return { success: false, message: error.message };
  }
});

/* ---------------- RECORDER LOGIC ---------------- */

ipcMain.on("recorder:start", () => {
  recorderState.isRecording = true;
  recorderState.isPaused = false;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setMinimizable(false);
  }

  startTime = Date.now() - recorderState.seconds * 1000;

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!recorderState.isPaused && startTime) {
      recorderState.seconds = Math.floor((Date.now() - startTime) / 1000);
      broadcastRecorderState();
    }
  }, 200);

  broadcastRecorderState();
});

ipcMain.on("recorder:stop", () => {
  recorderState.isRecording = false;
  recorderState.isPaused = false;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setMinimizable(true);
  }

  clearInterval(timerInterval);

  // 🔥 Always update state first
  broadcastRecorderState();

  // 🔥 SAFELY notify windows (no timeout)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("recorder:finished");
  }

  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.webContents.send("recorder:finished");
  }
});

/* 🔥 STORE AUDIO */
ipcMain.on("set-recorded-chunks", (event, chunks) => {
  recordedChunksGlobal = chunks;
});

/* 🔥 GET AUDIO */
ipcMain.handle("get-recorded-chunks", () => {
  return recordedChunksGlobal;
});

/* 🔥 CLEAR AUDIO */
ipcMain.on("clear-recorded-chunks", () => {
  recordedChunksGlobal = [];
});

ipcMain.on("recorder:reset", () => {
  recorderState = {
    isRecording: false,
    isPaused: false,
    seconds: 0,
  };

  startTime = null;
  pauseTime = null;

  clearInterval(timerInterval);

  // 🔥 CLEAR AUDIO ALSO
  recordedChunksGlobal = [];

  broadcastRecorderState();
});

/* ---------------- AUDIO ---------------- */

ipcMain.on("save-audio", async (event, buffer) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: "recording.ogg",
  });

  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer));
  }
});

ipcMain.handle("get-system-audio", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
  });

  return sources[0]?.id;
});

/* ---------------- APP BEHAVIOR ---------------- */

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuiting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
