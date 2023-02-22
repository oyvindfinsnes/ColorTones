const { app, Menu, Tray, ipcMain, dialog, BrowserWindow, globalShortcut } = require("electron");
const { parseFile } = require("music-metadata");
const path = require("path");
const fs = require("fs");
const os = require("os");

let mainWindow = null;
const sources = {};

// Handlers ====================================================================

const handleReadSourceFilesData = async dir => {
    const audioFiles = await fs.promises.readdir(dir);
    const targetDir = path.basename(dir);

    // Make a new config or reset the existing data
    sources[targetDir] = { basePath: dir };

    for (const audioFile of audioFiles) {
        const fileHash = createHash(audioFile);
        
        try {
            const metadata = await parseFile(path.join(dir, audioFile));
            const { artist, title } = metadata.common;
            const obj = {
                fileName: audioFile,
                duration: metadata.format.duration
            };

            if (artist !== undefined && title !== undefined) {
                obj["artist"] = metadata.common.artist;
                obj["title"] = metadata.common.title;
            } else {
                obj["unfinished"] = true;
            }

            sources[targetDir][fileHash] = obj;
        } catch {
            // The file probably wasn't music, or not supported (very unlikely)
        }
    }

    let pickedExample = null;
    const regex = new RegExp(/\.[^/.]+$/);

    Object.keys(sources[targetDir]).find(trackID => {
        const target = sources[targetDir][trackID];
        if (target.hasOwnProperty("unfinished")) {
            pickedExample = target.fileName.replace(regex, "");
            return;
        }
    });

    return { targetDir, pickedExample };
};

const handleFolderSelectSource = async () => {
    const opts = { properties: ["openDirectory"] };
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, opts);

    return canceled 
        ? { targetDir: null, pickedExample: null }
        : handleReadSourceFilesData(filePaths[0]);
};

const handleFinalizeSourceFiles = async (checkedRadioID, isReversed, targetDir) => {
    Object.keys(sources[targetDir]).forEach(trackID => {
        const target = sources[targetDir][trackID];
        if (target.hasOwnProperty("unfinished")) {
            delete sources[targetDir][trackID]["unfinished"];
            const fileName = path.parse(sources[targetDir][trackID].fileName).name;
            
            switch (checkedRadioID) {
                case "inpTrack":
                    sources[targetDir][trackID].title = fileName.trim();
                    break;
                case "inpArtist":
                    sources[targetDir][trackID].artist = fileName.trim();
                    break;
                case "inpTrackArtist":
                    let parts = fileName.split("-");
                    
                    if (parts.length > 2) {
                        const first = parts.shift();
                        const last = parts.join("-");
                        parts = [first, last];
                    }

                    if (isReversed) {
                        sources[targetDir][trackID].title = parts[0].trim();
                        sources[targetDir][trackID].artist = parts[1].trim();
                    } else {
                        sources[targetDir][trackID].title = parts[1].trim();
                        sources[targetDir][trackID].artist = parts[0].trim();
                    }
                    break;
            }
        }
    });

    return sources;
};

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

// Utilities ===================================================================

// https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
const createHash = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;

    for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

// Init ========================================================================

const setup = () => {
    createMainWindow();

    ipcMain.on("minimizeWindow", () => mainWindow.minimize());
    ipcMain.on("maximizeWindow", () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
    ipcMain.on("closeWindow", () => mainWindow.hide());
    ipcMain.handle("requestTemplate", async (e, name) => {
        const templatePath = path.join(__dirname, "app", "templates", name + ".html");
        return await fs.promises.readFile(templatePath, "utf8");
    });
    ipcMain.handle("folderSelectSource", async () => handleFolderSelectSource());
    ipcMain.handle("finalizeSourceFiles", async (e, checkedRadioID, isReversed, targetDir) => {
        return handleFinalizeSourceFiles(checkedRadioID, isReversed, targetDir);
    });
};

app.on("ready", () => {
    setup();
});

app.on("window-all-closed", () => {
	app.quit();
});
