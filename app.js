const { app, Menu, Tray, ipcMain, dialog, BrowserWindow, globalShortcut } = require("electron");
const { ModalTemplate, ModalAddSource, ModalAddPlaylist } = require("./app/lib/modalhandlers");
const { parseFile } = require("music-metadata");
const database = require("./app/lib/database");
const sqlite3 = require("sqlite3");
const path = require("path");
const got = require("got");
const fs = require("fs");

const getDBPath = () => {
    const appPath = app.getAppPath();
    const basePath = app.isPackaged
        ? appPath.replace("/app.asar", "")
        : appPath;

    return path.resolve(basePath, "appdata.sqlite");
};

let mainWindow = null;
const dbPath = getDBPath();

const createMainWindow = () => {
    const iconPath = path.join(__dirname, "app", "assets", "icon", "app", "256x256.png");
    Menu.setApplicationMenu(null);
    
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
        backgroundColor: "#222222",
        icon: iconPath,
        webPreferences: { preload: path.join(__dirname, "preload.js") }
    });

    mainWindow.center();

    mainWindow.once("ready-to-show", () => mainWindow.show());
    mainWindow.loadURL(path.join(__dirname, "app", "fullplayer", "index.html"));

    mainWindow.webContents.openDevTools();
};

const setup = () => {
    createMainWindow();

    // Argument funnels for handlers
    ipcMain.on("minimizeWindow", () => mainWindow.minimize());
    ipcMain.on("maximizeWindow", () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
    ipcMain.on("closeWindow", () => mainWindow.hide());
    ipcMain.handle("requestTemplate", async (e, name) => await ModalTemplate.request(name, path.join, fs.promises.readFile));
    ipcMain.handle("folderSelectSource", async () => await ModalAddSource.handleSelect(dialog, mainWindow, fs.promises.readdir, path, parseFile));
    ipcMain.handle("finalizeSourceFiles", async (e, checkedRadioID, isReversed, sources, sourcePath) => ModalAddSource.finalizeMusicDataFromSourcePath(checkedRadioID, isReversed, sources, sourcePath));
};

app.whenReady().then(() => {
    setup();
});

app.on("window-all-closed", () => {
	app.quit();
});
