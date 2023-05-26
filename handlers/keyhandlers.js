const { globalShortcut } = require("electron");

const registerGlobalAppKeys = () => {
    globalShortcut.register("MediaPreviousTrack", () => {
        global.sharedState.mainWindow.webContents.send("globalPreviousTrack");
    });
    
    globalShortcut.register("MediaPlayPause", () => {
        global.sharedState.mainWindow.webContents.send("globalPlayPause");
    });

    globalShortcut.register("MediaNextTrack", () => {
        global.sharedState.mainWindow.webContents.send("globalNextTrack");
    });
}

module.exports = { registerGlobalAppKeys };
