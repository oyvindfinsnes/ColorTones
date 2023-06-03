const { app, globalShortcut } = require("electron");
const schedule = require("node-schedule");
const path = require("path");
const fs = require("fs");

const { Config } = require("./lib/config");
const { Database } = require("./lib/database");
const { createMainWindow } = require("./lib/mainWindow");
const { registerMainHandlers } = require("./lib/mainHandlers");
const { registerRendererHandlers } = require("./lib/rendererHandlers");

const getResourcesPath = () => {
    let appPath = app.getAppPath();

    if (app.isPackaged) {
        appPath = appPath.replace("app.asar", "");
    }

    appPath = path.join(appPath, "data");

    if (!fs.existsSync(appPath)) {
        fs.mkdirSync(appPath);
    }
    
    return appPath;
}

const getDatabasePath = () => {
    return path.join(getResourcesPath(), "appdata.sqlite");
}

const setup = () => {
    global.sharedState = {};
    global.sharedState.config = new Config(getResourcesPath());
    global.sharedState.database = new Database(getDatabasePath());
    
    createMainWindow();
    registerMainHandlers();
    registerRendererHandlers();
}

app.whenReady().then(() => {
    setup();

    schedule.scheduleJob("*/15 * * * *", () => {
        global.sharedState.config.save();
    });

    app.on("will-quit", () => {
        globalShortcut.unregisterAll();
        global.sharedState.config.save();
    });
});
