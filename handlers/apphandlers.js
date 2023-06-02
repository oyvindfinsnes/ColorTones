const { app, ipcMain } = require("electron");

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
    ipcMain.on("quitApp", () => {
        app.quit();
    });
    ipcMain.on("setAppBackground", (e, color) => {
        global.sharedState.mainWindow.setBackgroundColor(color);
    });
    global.sharedState["mainWindow"].on("move", () => {
        const bounds = global.sharedState["mainWindow"].getBounds();
        global.sharedState["config"].setWindowPosition(bounds.x, bounds.y);
    });
    global.sharedState["mainWindow"].on("resize", () => {
        const bounds = global.sharedState["mainWindow"].getBounds();
        global.sharedState["config"].setWindowSize(bounds.width, bounds.height);
    });
}

module.exports = { registerAppHandlers };
