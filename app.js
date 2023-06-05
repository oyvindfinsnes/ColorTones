const { app } = require("electron");
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

app.whenReady().then(() => {
    global.sharedState = {};
    global.sharedState.config = new Config(getResourcesPath());
    global.sharedState.database = new Database(getDatabasePath());
    
    createMainWindow();
    registerMainHandlers();
    registerRendererHandlers();
});
