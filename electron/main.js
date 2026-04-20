const { app, BrowserWindow, ipcMain, Menu, dialog, desktopCapturer, screen } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let floatingWindow = null;

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

  const { width, height } = screen
  .getDisplayNearestPoint(screen.getCursorScreenPoint())
  .workAreaSize;

  const winWidth = 400;
  const winHeight = 700;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: width - winWidth - 20,
    y: height - winHeight - 20,
    minWidth: 350,
    minHeight: 600,
    show: false,
    backgroundColor: "#0f0f0f",
    resizable: true,
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
    mainWindow.webContents.send("recorder:update", recorderState);
  });

  /* 🔥 MINIMIZE → FLOATING */
  mainWindow.on("minimize", (e) => {
    e.preventDefault();
    mainWindow.hide();

    if (!floatingWindow) createFloatingWindow();

    floatingWindow.show();
    floatingWindow.focus();

    floatingWindow.webContents.send("recorder:update", recorderState);
  });

  /* 🔥 CLOSE → FLOATING */
  mainWindow.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();

      if (!floatingWindow) createFloatingWindow();

      floatingWindow.show();
      floatingWindow.focus();

      floatingWindow.webContents.send("recorder:update", recorderState);
    }
  });
}

/* ---------------- FLOATING WINDOW ---------------- */
function createFloatingWindow() {
  if (floatingWindow) return;

   const { width, height } = screen
  .getDisplayNearestPoint(screen.getCursorScreenPoint())
  .workAreaSize;

  const floatWidth = 200;
  const floatHeight = 70;

  floatingWindow = new BrowserWindow({
    
    width: floatWidth,
    height: floatHeight,
    x: width - floatWidth - 20,
    y: height - floatHeight - 20,
    frame: false,
    backgroundColor: "#111111",
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    floatingWindow.loadURL("http://localhost:5173#mini");
  } else {
    floatingWindow.loadFile(
      path.join(__dirname, "../ui/dist/index.html"),
      { hash: "mini" }
    );
  }

  floatingWindow.once("ready-to-show", () => {
    floatingWindow.show();
    floatingWindow.focus();

    floatingWindow.webContents.send("recorder:update", recorderState);
  });

  floatingWindow.on("close", (e) => {
    e.preventDefault();
    floatingWindow.hide();
  });

  floatingWindow.on("closed", () => {
    floatingWindow = null;
  });
}

/* ---------------- APP READY ---------------- */
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createMainWindow();
});

/* ---------------- WINDOW FLOW ---------------- */

ipcMain.on("start-recorder", () => {
  if (!floatingWindow) createFloatingWindow();

  if (mainWindow) mainWindow.hide();

  floatingWindow.show();
  floatingWindow.focus();
});

ipcMain.on("open-main-window", () => {
  if (floatingWindow) floatingWindow.hide();

  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();

    // 🔥 IMPORTANT FIX: navigate to dictate page
    if (isDev) {
      mainWindow.loadURL("http://localhost:5173#dictate");
    } else {
      mainWindow.loadFile(
        path.join(__dirname, "../ui/dist/index.html"),
        { hash: "dictate" }
      );
    }

    mainWindow.webContents.send("recorder:update", recorderState);
  }
});

/* ---------------- WINDOW CONTROLS ---------------- */

ipcMain.on("minimize-app", () => {
  if (mainWindow?.isVisible()) mainWindow.minimize();
  else if (floatingWindow?.isVisible()) floatingWindow.minimize();
});

ipcMain.on("toggle-maximize", () => {
  const win = mainWindow?.isVisible() ? mainWindow : floatingWindow;
  if (!win) return;

  win.isMaximized() ? win.unmaximize() : win.maximize();
});

/* ---------------- RECORDER LOGIC ---------------- */

/* 🎙 START */
ipcMain.on("recorder:start", () => {
  recorderState.isRecording = true;
  recorderState.isPaused = false;

  startTime = Date.now() - recorderState.seconds * 1000;

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!recorderState.isPaused && startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      recorderState.seconds = elapsed;
      broadcastRecorderState();
    }
  }, 200);

  broadcastRecorderState();
});

/* ⏹ STOP */
ipcMain.on("recorder:stop", () => {
  recorderState.isRecording = false;
  recorderState.isPaused = false;

  clearInterval(timerInterval);

  broadcastRecorderState();
});

/* ⏸ PAUSE */
ipcMain.on("recorder:pause", () => {
  recorderState.isPaused = true;
  pauseTime = Date.now();

  broadcastRecorderState();
});

/* ▶ RESUME */
ipcMain.on("recorder:resume", () => {
  recorderState.isPaused = false;

  if (startTime && pauseTime) {
    startTime += Date.now() - pauseTime;
  }

  broadcastRecorderState();
});

/* 🔁 RESET */
ipcMain.on("recorder:reset", () => {
  recorderState = {
    isRecording: false,
    isPaused: false,
    seconds: 0,
  };

  startTime = null;
  pauseTime = null;

  clearInterval(timerInterval);

  broadcastRecorderState();
});

/* ---------------- AUDIO ---------------- */

ipcMain.on("save-audio", async (event, buffer) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: "recording.webm",
  });

  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer));
  }
});

ipcMain.handle("get-system-audio", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    fetchWindowIcons: false,
  });

  return sources[0]?.id;
});

/* ---------------- APP BEHAVIOR ---------------- */

app.on("window-all-closed", (e) => {
  e.preventDefault();
});

app.on("before-quit", () => {
  app.isQuiting = true;
});