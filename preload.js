const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    minimizeWindow: () => ipcRenderer.send("minimizeWindow"),
    maximizeWindow: () => ipcRenderer.send("maximizeWindow"),
    closeWindow: () => ipcRenderer.send("closeWindow"),
    quitApp: () => ipcRenderer.send("quitApp"),
    setAppBackground: (...args) => ipcRenderer.send("setAppBackground", ...args),
    requestTemplate: (...args) => ipcRenderer.invoke("requestTemplate", ...args),
    folderSelectSource: () => ipcRenderer.invoke("folderSelectSource"),
    finalizeSourceFiles: (...args) => ipcRenderer.invoke("finalizeSourceFiles", ...args)
});
