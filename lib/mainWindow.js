const { Menu, Tray, BrowserWindow, nativeImage } = require("electron");
const path = require("path");

const createMainWindow = () => {
    Menu.setApplicationMenu(null);

    const iconPath = path.join(__dirname, "..", "app", "assets", "icon", "app", "256x256.png");
    
    const tray = new Tray(iconPath);
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: "Exit", click: () => mainWindow.close() }
    ]));
    tray.on("click", () => mainWindow.show());

    const windowSize = global.sharedState.config.getWindowSize();
    const windowPosition = global.sharedState.config.getWindowPosition();
    mainWindow = new BrowserWindow({
        show: false,
        frame: false,
        ...(windowPosition.x != "center" && { x: windowPosition.x }),
        ...(windowPosition.y != "center" && { y: windowPosition.y }),
        width: windowSize.width,
        height: windowSize.height,
        minWidth: windowSize.minWidth,
        minHeight: windowSize.minHeight,
        backgroundColor: "#121212",
        icon: iconPath,
        webPreferences: { preload: path.join(__dirname, "..", "preload.js") }
    });

    mainWindow.once("ready-to-show", () => mainWindow.show());
    mainWindow.loadURL(path.join(__dirname, "..", "app", "fullplayer", "index.html"));

    const iconBase = path.join(__dirname, "..", "app", "assets", "icon", "ui");
    const prevButton = path.join(iconBase, "skip_previous.png");
    const playButton = path.join(iconBase, "play_white.png");
    const pauseButton = path.join(iconBase, "pause_white.png");
    const nextButton = path.join(iconBase, "skip_next.png");
    mainWindow.setThumbarButtons([
        {
            icon: prevButton,
            click () { console.log("prev") }
        },
        {
            icon: playButton,
            click () { console.log("play") }
        },
        {
            icon: nextButton,
            click () { console.log("next") }
        }
    ]);

    global.sharedState.mainWindow = mainWindow;
    
    setTimeout(() => mainWindow.webContents.openDevTools(), 1000);
}

module.exports = { createMainWindow };
