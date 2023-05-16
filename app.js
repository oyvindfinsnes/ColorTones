const { app, Menu, Tray, ipcMain, dialog, BrowserWindow, globalShortcut } = require("electron");
const { ModalTemplate, ModalAddSource, ModalAddPlaylist } = require("./app/fullplayer/templates/templatehandlers");
const { Database } = require("./app/core/lib/database");
const { parseFile } = require("music-metadata");
const sqlite3 = require("sqlite3");
const path = require("path");
const got = require("got");
const fs = require("fs");

const getDBPath = () => {
    const appPath = app.getAppPath();
    const basePath = app.isPackaged
        ? appPath.replace("app.asar", "")
        : appPath;

    return path.resolve(basePath, "appdata.sqlite");
};

let mainWindow = null;
const dbPath = getDBPath();

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
};

const tempfn = async () => {
    console.log("getting data");
    const musicData = await ModalAddSource.getMusicDataFromSourcePath("C:/Users/Oyvin/Desktop/Music", fs.promises.readdir, path, parseFile);
    const sources = JSON.parse(musicData.sources);

    for (let i = 0; i < sources.length; i++) {
        const [artist, title] = path.parse(sources[i].fileName).name.split(" - ");
        const albumInfo = await Database.getExternalAlbumData(got.get, path.join, artist.trim(), title.trim());

        delete sources[i]["unfinished"];

        // Since any API will block traffic that is too frequent we have to use
        // a synthetic delay between each legitimate request
        await new Promise(res => setTimeout(res, 200));

        if (albumInfo === undefined) continue;

        // Some tracks are banned thus unavailable, or just unusable because the
        // returned result is either wrong based on data or has no usable info
        const isUnusable = !albumInfo.hasOwnProperty("album") || !albumInfo["toptags"]["tag"].length;
        const isBanned = albumInfo.hasOwnProperty("toptags") && albumInfo["toptags"]["tag"].length && albumInfo["toptags"]["tag"][0]["name"] === "banned";
        if (isBanned || isUnusable) continue;

        sources[i].albumName = Buffer.from(albumInfo["album"]["title"], "utf-8").toString();
        sources[i].img = albumInfo["album"]["image"][1]["#text"];
    }

    fs.writeFileSync("tempdata.json", JSON.stringify(sources, null, 4));
    console.log("done getting");
};

const setup = () => {
    createMainWindow();

    // Argument funnels for handlers
    ipcMain.on("minimizeWindow", () => mainWindow.minimize());
    ipcMain.on("maximizeWindow", () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
    ipcMain.on("closeWindow", () => mainWindow.hide());
    ipcMain.on("setAppBackground", (e, color) => mainWindow.setBackgroundColor(color));
    ipcMain.handle("requestTemplate", async (e, name) => await ModalTemplate.request(name, path.join, fs.promises.readFile));
    ipcMain.handle("folderSelectSource", async () => await ModalAddSource.handleSelect(dialog, mainWindow, fs.promises.readdir, path, parseFile));
    ipcMain.handle("finalizeSourceFiles", async (e, checkedRadioID, isReversed, sources, sourcePath) => ModalAddSource.finalizeMusicDataFromSourcePath(checkedRadioID, isReversed, sources, sourcePath));

    //tempfn();
    /* const sources = JSON.parse(fs.readFileSync("tracks.json"));
    
    const artistNames = new Set();
    const albumDataByArtist = {};
    const trackData = [];

    for (const source of sources) {
        const { fileName, artist, title, albumName, img } = source;
        
        artistNames.add(artist);

        if (!albumDataByArtist.hasOwnProperty(artist)) {
            albumDataByArtist[artist] = [];
        }

        if (!albumDataByArtist[artist].find(o => o.name === albumName)) {
            albumDataByArtist[artist].push({
                name: albumName,
                img: img,
                artist: artist
            });
        }

        trackData.push({ filename: fileName, name: title, albumname: albumName, artistname: artist, sourcepath: "C:/Users/Oyvin/Desktop/Music" });
    }

    await database.init(new sqlite3.Database(dbPath));

    database.addSource("C:/Users/Oyvin/Desktop/Music", "Music");

    database.addArtists(artistNames);
    database.addAlbums(albumDataByArtist);
    database.addTracks(trackData); */
};

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
    setup();
});

app.on("window-all-closed", () => {
	app.quit();
});
