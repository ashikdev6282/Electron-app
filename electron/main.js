const { app, BrowserWindow, ipcMain , Menu } = require("electron");
const path = require("path");

let mainWindow;
let floatingWindow;

function createMainWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL("http://localhost:5173");
  mainWindow.setMenu(null);

  // 🔥 IMPORTANT: hide instead of quit
  mainWindow.on("close", (e) => {
    e.preventDefault();
    mainWindow.hide();

    // show floating button again
    if (floatingWindow) {
      floatingWindow.show();
      floatingWindow.setAlwaysOnTop(true);
    }
  });
}
function createFloatingWindow() {
  floatingWindow = new BrowserWindow({
    width: 60,
    height: 60,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  floatingWindow.loadURL("http://localhost:5173/#/floating");

  floatingWindow.once("ready-to-show", () => {
    floatingWindow.show();
  });
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createMainWindow();
  createFloatingWindow();
});

ipcMain.on("open-main-window", () => {
  console.log("FLOATING CLICKED");

  // hide floating
  if (floatingWindow) {
    floatingWindow.hide();
  }

  // show main app
  mainWindow.show();
  mainWindow.focus();
});

app.on("window-all-closed", (e) => {
  e.preventDefault(); // keep app alive
});