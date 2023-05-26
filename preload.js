const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    minimizeWindow: () => ipcRenderer.send("minimizeWindow"),
    maximizeWindow: () => ipcRenderer.send("maximizeWindow"),
    closeWindow: () => ipcRenderer.send("closeWindow"),
    quitApp: () => ipcRenderer.send("quitApp"),
    setAppBackground: (...args) => ipcRenderer.send("setAppBackground", ...args),
    globalPreviousTrack: callback => ipcRenderer.on("globalPreviousTrack", callback),
    globalPlayPause: callback => ipcRenderer.on("globalPlayPause", callback),
    globalNextTrack: callback => ipcRenderer.on("globalNextTrack", callback),
    requestTemplate: (...args) => ipcRenderer.invoke("requestTemplate", ...args),
    requestDatabaseInteraction: (...args) => ipcRenderer.invoke("requestDatabaseInteraction", ...args),
    folderSelectSource: () => ipcRenderer.invoke("folderSelectSource"),
    finalizeSourceFiles: (...args) => ipcRenderer.invoke("finalizeSourceFiles", ...args)
});
