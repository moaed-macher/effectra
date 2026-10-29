// Effectra Desktop: zeigt die Web-App in einem eigenen, randlosen Fenster.
// Die App selbst kommt live von Netlify – neue Versionen sind also sofort da,
// ohne neue exe. Nur das Fenster-Programm selbst aktualisiert sich über GitHub.
const { app, BrowserWindow, shell, Menu, Notification, ipcMain, nativeTheme, net } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_URL = "https://effectra.netlify.app/";
const APP_ORIGIN = new URL(APP_URL).origin;
const OFFLINE = path.join(__dirname, "offline.html");
const OVERLAY_H = 48;

app.setAppUserModelId("app.effectra.desktop"); // nötig für Windows-Benachrichtigungen

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
let offlineTimer = null;
let update = { state: "idle" }; // letzter Update-Stand, damit die App ihn nach einem Neuladen kennt

const stateFile = () => path.join(app.getPath("userData"), "fenster.json");
function loadState() { try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch (e) { return {}; } }
function saveState() {
  if (!win || win.isDestroyed()) return;
  try { fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), max: win.isMaximized() })); } catch (e) {}
}

function overlayColors(dark) {
  return dark ? { color: "#000000", symbolColor: "#FFFFFF" } : { color: "#F2F2F7", symbolColor: "#1C1C1E" };
}

// Nur Nachrichten von der echten App oder der Offline-Seite annehmen
function trusted(e) {
  const url = (e.senderFrame && e.senderFrame.url) || "";
  return url.startsWith(APP_ORIGIN + "/") || url.startsWith("file://");
}

function showOffline() {
  if (!win || win.isDestroyed()) return;
  win.loadFile(OFFLINE);
  clearInterval(offlineTimer);
  // Sobald das Internet zurück ist, automatisch wieder die App laden
  offlineTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return clearInterval(offlineTimer);
    net.fetch(APP_URL + "version.json", { cache: "no-store" })
      .then((r) => { if (r.ok) { clearInterval(offlineTimer); win.loadURL(APP_URL); } })
      .catch(() => {});
  }, 5000);
}

function createWindow() {
  const s = loadState();
  const dark = nativeTheme.shouldUseDarkColors;
  win = new BrowserWindow({
    width: s.width || 1360,
    height: s.height || 880,
    x: s.x, y: s.y,
    minWidth: 380,
    minHeight: 560,
    title: "Effectra",
    backgroundColor: dark ? "#000000" : "#F2F2F7",
    titleBarStyle: "hidden",
    titleBarOverlay: { ...overlayColors(dark), height: OVERLAY_H },
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true
    }
  });
  if (s.max) win.maximize();
  win.once("ready-to-show", () => win.show());
  win.on("close", saveState);
  win.loadURL(APP_URL);

  win.webContents.on("did-fail-load", (e, code, desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && String(url).startsWith(APP_ORIGIN)) showOffline();
  });
  win.webContents.on("did-navigate", (e, url) => { if (url.startsWith(APP_ORIGIN)) clearInterval(offlineTimer); });

  // Externe Links im normalen Browser öffnen, nie im App-Fenster
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (url.startsWith(APP_ORIGIN + "/")) return;
    e.preventDefault();
    if (/^https:\/\//.test(url)) shell.openExternal(url);
  });
  // Nur Benachrichtigungen erlauben, sonst keine Geräte-Rechte
  win.webContents.session.setPermissionRequestHandler((wc, perm, cb) => cb(perm === "notifications"));
}

function send(state) {
  update = state;
  if (win && !win.isDestroyed()) win.webContents.send("desk:update", state);
}

// Updates des Fenster-Programms über GitHub Releases: lädt im Hintergrund,
// die App zeigt dann „Neu starten“ – ein Klick und es ist installiert.
let autoUpdater = null;
function setupUpdates() {
  if (!app.isPackaged) return;
  try { ({ autoUpdater } = require("electron-updater")); } catch (e) { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  let lastPct = -1;
  autoUpdater.on("checking-for-update", () => { if (update.state !== "ready" && update.state !== "downloading") send({ state: "checking" }); });
  autoUpdater.on("update-not-available", () => { if (update.state !== "ready") send({ state: "none" }); });
  autoUpdater.on("update-available", (info) => send({ state: "downloading", version: info.version, percent: 0 }));
  autoUpdater.on("download-progress", (p) => {
    const pct = Math.round(p.percent || 0);
    if (pct === lastPct) return;
    lastPct = pct;
    send({ state: "downloading", version: update.version, percent: pct });
  });
  autoUpdater.on("update-downloaded", (info) => {
    send({ state: "ready", version: info.version });
    if (Notification.isSupported() && win && !win.isFocused()) {
      new Notification({ title: "Effectra-Update bereit", body: "Version " + info.version + " – in Effectra auf „Neu starten“ klicken." }).show();
    }
  });
  autoUpdater.on("error", () => { if (update.state !== "ready") send({ state: "error" }); });
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => { if (update.state !== "ready") autoUpdater.checkForUpdates().catch(() => {}); }, 2 * 60 * 60 * 1000);
}

ipcMain.handle("desk:info", (e) => {
  if (!trusted(e)) return null;
  return { version: app.getVersion(), packaged: app.isPackaged, update };
});
ipcMain.handle("desk:check", (e) => {
  if (!trusted(e)) return null;
  if (!autoUpdater) return { state: "dev" };
  if (update.state === "ready" || update.state === "downloading") return update;
  return autoUpdater.checkForUpdates().then(() => update, () => ({ state: "error" }));
});
ipcMain.on("desk:install", (e) => {
  if (!trusted(e) || !autoUpdater || update.state !== "ready") return;
  saveState();
  setImmediate(() => autoUpdater.quitAndInstall(true, true));
});
ipcMain.on("desk:theme", (e, dark) => {
  if (!trusted(e) || !win || win.isDestroyed()) return;
  try { win.setTitleBarOverlay({ ...overlayColors(!!dark), height: OVERLAY_H }); } catch (err) {}
  win.setBackgroundColor(dark ? "#000000" : "#F2F2F7");
});
ipcMain.on("desk:retry", (e) => { if (trusted(e) && win && !win.isDestroyed()) win.loadURL(APP_URL); });

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
Menu.setApplicationMenu(null);
app.whenReady().then(() => {
  createWindow();
  setupUpdates();
});
app.on("window-all-closed", () => app.quit());
