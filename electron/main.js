const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const { desktopCapturer } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let floatingWindow = null;
const isDev = !app.isPackaged;

/* ---------------- MAIN WINDOW ---------------- */
function createMainWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false, // hidden by default
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../ui/dist/index.html"));
  }

  mainWindow.setMenu(null);

  // Hide instead of quitting
  mainWindow.on("close", (e) => {
    e.preventDefault();
    mainWindow.hide();
    if (floatingWindow) floatingWindow.show();
  });
}

/* ---------------- FLOATING RECORDER ---------------- */
function createFloatingWindow() {
  floatingWindow = new BrowserWindow({
    width: 260,
    height: 64,
    frame: false,
    transparent: false,           // 🔥 FIX: disable transparency
    backgroundColor: "#111111",    // 🔥 FIX: force visible background
    alwaysOnTop: true,
    skipTaskbar: false,            // 🔥 FIX: visible in taskbar
    resizable: false,
    movable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    floatingWindow.loadURL("http://localhost:5173/#/recorder");
  } else {
    floatingWindow.loadFile(
      path.join(__dirname, "../ui/dist/index.html"),
      { hash: "recorder" }
    );
  }

  floatingWindow.once("ready-to-show", () => {
    floatingWindow.show();
    floatingWindow.focus();
  });
}

/* ---------------- APP READY ---------------- */
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createMainWindow();
  createFloatingWindow();
});

/* ---------------- IPC ---------------- */
ipcMain.on("open-main-window", () => {
  if (floatingWindow) floatingWindow.hide();
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on("save-audio", async (event, buffer) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: "recording.webm"
  });
  if (filePath) fs.writeFileSync(filePath, Buffer.from(buffer));
});

ipcMain.handle("get-system-audio", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    fetchWindowIcons: false
  });
  return sources[0]?.id;
});

/* ---------------- KEEP APP ALIVE ---------------- */
app.on("window-all-closed", (e) => {
  e.preventDefault();
});