const { app, globalShortcut } = require("electron");
const schedule = require("node-schedule");
const sqlite3 = require("sqlite3");
const path = require("path");
const fs = require("fs");

const getResourcesPath = () => {
    const appPath = app.getAppPath();
    const basePath = app.isPackaged
        ? appPath.replace("app.asar", "")
        : appPath;
    const returnPath = path.join(basePath, "data");

    if (!fs.existsSync(returnPath)) fs.mkdirSync(returnPath);
    
    return returnPath;
};

const resourcesPath = getResourcesPath();
const dbPath = path.join(resourcesPath, "appdata.sqlite");

global.sharedState = { resourcesPath, dbPath };

const { Config } = require("./lib/config");
const { createMainWindow } = require("./lib/mainWindow");
const { registerAppHandlers } = require("./handlers/apphandlers");
const { registerRendererHandlers } = require("./handlers/rendererhandlers");
const { registerGlobalAppKeys } = require("./handlers/keyhandlers");

const { Database } = require("./lib/database");
Database.init(new sqlite3.Database(dbPath));

const setup = () => {
    global.sharedState["config"] = new Config();
    createMainWindow();
    
    registerAppHandlers();
    registerRendererHandlers();
    registerGlobalAppKeys();
}

app.whenReady().then(() => {
    setup();

    schedule.scheduleJob("*/15 * * * *", () => {
        global.sharedState["config"].save();
    });

    app.on("will-quit", () => {
        globalShortcut.unregisterAll();
        global.sharedState["config"].save();
    });
});
