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
    requestAllDataForConfig: callback => ipcRenderer.on("requestAllDataForConfig", callback),
    receiveAllDataForConfig: (...args) => ipcRenderer.send("receiveAllDataForConfig", ...args),
    handleRequestNormalizedGains: callback => ipcRenderer.on("handleRequestNormalizedGains", callback),
    provideNormalizedGains: (...args) => ipcRenderer.send("provideNormalizedGains", ...args),
    requestTemplate: (...args) => ipcRenderer.invoke("requestTemplate", ...args),
    requestAudioPlayerData: (...args) => ipcRenderer.invoke("requestAudioPlayerData", ...args),
    requestDatabaseInteraction: (...args) => ipcRenderer.invoke("requestDatabaseInteraction", ...args),
    folderSelectSource: () => ipcRenderer.invoke("folderSelectSource"),
    finalizeSourceFiles: (...args) => ipcRenderer.invoke("finalizeSourceFiles", ...args)
});
