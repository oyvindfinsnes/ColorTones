const { app, ipcMain, globalShortcut } = require("electron");
const schedule = require("node-schedule");

const registerMainHandlers = () => {
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

    global.sharedState.mainWindow.on("move", () => {
        const bounds = global.sharedState.mainWindow.getBounds();
        global.sharedState.config.setWindowPosition(bounds.x, bounds.y);
    });
    global.sharedState.mainWindow.on("resize", () => {
        const bounds = global.sharedState.mainWindow.getBounds();
        global.sharedState.config.setWindowSize(bounds.width, bounds.height);
    });

    globalShortcut.register("MediaPreviousTrack", () => {
        global.sharedState.mainWindow.webContents.send("globalPreviousTrack");
    });
    
    globalShortcut.register("MediaPlayPause", () => {
        global.sharedState.mainWindow.webContents.send("globalPlayPause");
    });

    globalShortcut.register("MediaNextTrack", () => {
        global.sharedState.mainWindow.webContents.send("globalNextTrack");
    });

    schedule.scheduleJob("*/15 * * * *", () => {
        global.sharedState.config.save();
    });
    app.once("before-quit", async e => {
        e.preventDefault();
        globalShortcut.unregisterAll();
        await global.sharedState.config.save();
        app.quit();
    });
}

module.exports = { registerMainHandlers };
