const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
  desktopCapturer,
  screen,
} = require("electron");

const path = require("path");
const fs = require("fs");

require("dotenv").config();

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

  /* 🔽 MINIMIZE → FLOATING */
  mainWindow.on("minimize", (e) => {
    e.preventDefault();
    mainWindow.hide();

    if (!floatingWindow) createFloatingWindow();

    floatingWindow.show();
    floatingWindow.focus();

    broadcastRecorderState();
  });

  /* ❌ CLOSE → FULL EXIT */
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
    broadcastRecorderState();
  });

  /* ❌ CLOSE → FULL EXIT */
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

    if (isDev) {
      mainWindow.loadURL("http://localhost:5173#dictate");
    } else {
      mainWindow.loadFile(
        path.join(__dirname, "../ui/dist/index.html"),
        { hash: "dictate" }
      );
    }

    broadcastRecorderState();
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

/* ---------------- LOGIN API ---------------- */

ipcMain.handle("login", async (event, credentials) => {
  try {
    const response = await fetch("https://www.medrecq.com/api/login.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Transaction-ID": process.env.TRANSACTION_ID,
      },
      body: JSON.stringify(credentials),
    });

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: "Invalid server response" };
    }

  } catch (error) {
    return { success: false, message: error.message };
  }
});

/* ---------------- RECORDER LOGIC ---------------- */

ipcMain.on("recorder:start", () => {
  recorderState.isRecording = true;
  recorderState.isPaused = false;

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

  clearInterval(timerInterval);
  broadcastRecorderState();
});

ipcMain.on("recorder:pause", () => {
  recorderState.isPaused = true;
  pauseTime = Date.now();
  broadcastRecorderState();
});

ipcMain.on("recorder:resume", () => {
  recorderState.isPaused = false;

  if (startTime && pauseTime) {
    startTime += Date.now() - pauseTime;
  }

  broadcastRecorderState();
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