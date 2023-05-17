const { app, Menu, Tray, BrowserWindow, globalShortcut } = require("electron");
const sqlite3 = require("sqlite3");
const path = require("path");
const got = require("got");
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

const { Database } = require("./app/core/lib/database");
const { registerAppHandlers } = require("./handlers/apphandlers");
const { registerRendererHandlers } = require("./handlers/rendererhandlers");

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
    const musicData = await ModalAddSource.getMusicDataFromSourcePath("C:/Users/Oyvin/Desktop/Music");
    const sources = JSON.parse(musicData.sources);

    for (let i = 0; i < sources.length; i++) {
        const { artist, title } = sources[i];
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

    const writePath = path.join(resourcesPath, "tempdata.json");
    fs.writeFileSync(writePath, JSON.stringify(sources, null, 4));
    console.log("done getting");
};

const tempfn2 = async () => {
    const sources = JSON.parse(fs.readFileSync(path.join(resourcesPath, "tempdata.json")));
    
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

    await Database.init(new sqlite3.Database(dbPath));

    Database.addSource("C:/Users/Oyvin/Desktop/Music", "Music");

    Database.addArtists(artistNames);
    Database.addAlbums(albumDataByArtist);
    Database.addTracks(trackData);
}

const setup = () => {
    createMainWindow();
    registerAppHandlers();
    registerRendererHandlers();
    //tempfn();
    //tempfn2();
};

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
    setup();
});

app.on("window-all-closed", () => {
	app.quit();
});
