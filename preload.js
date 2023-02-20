const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    minimizeWindow: () => ipcRenderer.send("minimizeWindow"),
    maximizeWindow: () => ipcRenderer.send("maximizeWindow"),
    closeWindow: () => ipcRenderer.send("closeWindow"),
    requestTemplate: name => ipcRenderer.invoke("requestTemplate", name)
});
