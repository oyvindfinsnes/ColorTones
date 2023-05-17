const { ipcMain } = require("electron");

const registerAppHandlers = () => {
    ipcMain.on("minimizeWindow", () => {
        global.sharedState.mainWindow.minimize()
    });
    ipcMain.on("maximizeWindow", () => {
        global.sharedState.mainWindow.isMaximized()
            ? global.sharedState.mainWindow.unmaximize()
            : global.sharedState.mainWindow.maximize();
    });
    ipcMain.on("closeWindow", () => {
        global.sharedState.mainWindow.hide();
    });
    ipcMain.on("setAppBackground", (e, color) => {
        global.sharedState.mainWindow.setBackgroundColor(color);
    });
}

module.exports = { registerAppHandlers };
