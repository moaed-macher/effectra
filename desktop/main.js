// Effectra Desktop: zeigt die Web-App in einem eigenen Fenster.
const { app, BrowserWindow, shell, Menu, Notification } = require("electron");
const path = require("path");
const fs = require("fs");

app.setAppUserModelId("app.effectra.desktop"); // nötig für Windows-Benachrichtigungen

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
const stateFile = () => path.join(app.getPath("userData"), "fenster.json");
function loadState() { try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch (e) { return {}; } }
function saveState() {
  if (!win || win.isDestroyed()) return;
  try { fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), max: win.isMaximized() })); } catch (e) {}
}

function createWindow() {
  const s = loadState();
  win = new BrowserWindow({
    width: s.width || 1280,
    height: s.height || 860,
    x: s.x, y: s.y,
    minWidth: 380,
    minHeight: 560,
    title: "Effectra",
    backgroundColor: "#F2F2F7",
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true }
  });
  if (s.max) win.maximize();
  win.once("ready-to-show", () => win.show());
  win.on("close", saveState);
  win.loadFile(path.join(__dirname, "web", "index.html"));
  // Externe Links im normalen Browser öffnen, nie im App-Fenster
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file://")) { e.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); }
  });
  // Nur Benachrichtigungen erlauben, sonst keine Geräte-Rechte
  win.webContents.session.setPermissionRequestHandler((wc, perm, cb) => cb(perm === "notifications"));
}

// Automatische Updates über GitHub Releases
function checkUpdates() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try { ({ autoUpdater } = require("electron-updater")); } catch (e) { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-downloaded", (info) => {
    if (Notification.isSupported()) {
      new Notification({ title: "Effectra-Update bereit", body: "Version " + info.version + " wird beim nächsten Start installiert." }).show();
    }
  });
  autoUpdater.on("error", () => {});
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 6 * 60 * 60 * 1000);
}

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
Menu.setApplicationMenu(null);
app.whenReady().then(() => {
  createWindow();
  checkUpdates();
});
app.on("window-all-closed", () => app.quit());
