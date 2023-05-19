const { app, Menu, Tray, BrowserWindow } = require("electron");
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

let mainWindow = null;
const resourcesPath = getResourcesPath();
const dbPath = path.join(resourcesPath, "appdata.sqlite");

global.sharedState = { mainWindow, resourcesPath, dbPath };

const { registerAppHandlers } = require("./handlers/apphandlers");
const { registerRendererHandlers } = require("./handlers/rendererhandlers");

const { Database } = require("./lib/database");
Database.init(new sqlite3.Database(dbPath));

const createMainWindow = () => {
    const iconPath = path.join(__dirname, "app", "assets", "icon", "app", "256x256.png");
    
    const tray = new Tray(iconPath);
    const template = [{ label: "Quit", click: () => mainWindow.close() }];
    tray.setContextMenu(Menu.buildFromTemplate(template));
    tray.on("click", () => mainWindow.show());

    mainWindow = new BrowserWindow({
        show: false,
        frame: false,
        width: 1200,
        height: 700,
        minWidth: 650,
        minHeight: 600,
        backgroundColor: "#121212",
        icon: iconPath,
        webPreferences: { preload: path.join(__dirname, "preload.js") }
    });

    mainWindow.center();

    mainWindow.once("ready-to-show", () => mainWindow.show());
    mainWindow.loadURL(path.join(__dirname, "app", "fullplayer", "index.html"));

    mainWindow.webContents.openDevTools();
}

const setup = () => {
    createMainWindow();
    global.sharedState["mainWindow"] = mainWindow;
    
    registerAppHandlers();
    registerRendererHandlers();
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
    setup();
});
