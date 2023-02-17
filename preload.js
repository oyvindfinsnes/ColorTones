const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    requestModuleComponent: componentName => ipcRenderer.invoke("requestModuleComponent", componentName)
});
