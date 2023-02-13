const { app, Menu, ipcMain, BrowserWindow, globalShortcut } = require("electron");
const { join } = require("path");
const { readdir } = require("fs");
const { homedir } = require("os");

let mainWindow = null;

const createMainWindow = () => {
    Menu.setApplicationMenu(null);

    mainWindow = new BrowserWindow({
        show: false,
        width: 400,
        height: 400,
        backgroundColor: "#222222"
    });

    mainWindow.center();

    mainWindow.once("ready-to-show", () => mainWindow.show());
    mainWindow.loadURL(join(__dirname, "app", "index.html"));

    mainWindow.webContents.openDevTools();
};

const setup = () => {
    createMainWindow();
    //readdir(join(homedir(), "Desktop", "Music"), (err, res) => { console.log(res) });
};

app.on("ready", () => setup());
