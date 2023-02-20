const { app, Menu, ipcMain, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

let mainWindow = null;

const createMainWindow = () => {
    Menu.setApplicationMenu(null);

    mainWindow = new BrowserWindow({
        show: false,
        frame: false,
        width: 1200,
        height: 700,
        minWidth: 650,
        minHeight: 500,
        backgroundColor: "#222222",
        webPreferences: { preload: path.join(__dirname, "preload.js") }
    });

    mainWindow.center();

    mainWindow.once("ready-to-show", () => mainWindow.show());
    mainWindow.loadURL(path.join(__dirname, "app", "fullplayer", "index.html"));

    mainWindow.webContents.openDevTools();
};

// Init ========================================================================

const setup = () => {
    createMainWindow();

    ipcMain.on("minimizeWindow", () => mainWindow.minimize());
    ipcMain.on("maximizeWindow", () => {
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
    });
    ipcMain.on("closeWindow", () => mainWindow.close());
    ipcMain.handle("requestTemplate", async (e, name) => {
        const templatePath = path.join(__dirname, "app", "templates", name + ".html");
        return await fs.promises.readFile(templatePath, "utf8");
    });
    //readdir(join(homedir(), "Desktop", "Music"), (err, res) => { console.log(res) });
};

app.on("ready", () => {
    setup();
});

app.on("window-all-closed", () => {
	app.quit();
});
