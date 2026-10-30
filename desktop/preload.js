// Kleine, sichere Brücke zwischen App und Windows-Programm (Updates, Fensterfarbe, Autostart, Schnell-Eingabe)
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("effectraDesktop", {
  info: () => ipcRenderer.invoke("desk:info"),
  checkUpdate: () => ipcRenderer.invoke("desk:check"),
  installUpdate: () => ipcRenderer.send("desk:install"),
  onUpdate: (cb) => { ipcRenderer.on("desk:update", (_e, state) => { try { cb(state); } catch (err) {} }); },
  setTheme: (dark) => ipcRenderer.send("desk:theme", !!dark),
  setAutostart: (on) => ipcRenderer.invoke("desk:autostart", !!on),
  onQuick: (cb) => { ipcRenderer.on("desk:quick", () => { try { cb(); } catch (err) {} }); },
  retry: () => ipcRenderer.send("desk:retry")
});
