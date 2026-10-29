// Kleine, sichere Brücke zwischen App und Windows-Programm (nur Updates und Fensterfarbe)
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("effectraDesktop", {
  info: () => ipcRenderer.invoke("desk:info"),
  checkUpdate: () => ipcRenderer.invoke("desk:check"),
  installUpdate: () => ipcRenderer.send("desk:install"),
  onUpdate: (cb) => { ipcRenderer.on("desk:update", (_e, state) => { try { cb(state); } catch (err) {} }); },
  setTheme: (dark) => ipcRenderer.send("desk:theme", !!dark),
  retry: () => ipcRenderer.send("desk:retry")
});
