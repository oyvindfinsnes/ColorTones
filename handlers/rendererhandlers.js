const { dialog, ipcMain } = require("electron");
const { parseFile } = require("music-metadata");
const path = require("path");
const got = require("got");
const fs = require("fs");

const { Database } = require("../lib/database");

class Modal {
    static requestTemplate = async name => {
        const template = path.join(__dirname, "..", "app", "fullplayer", "templates", name + ".html");
        return await fs.promises.readFile(template, "utf8");
    }

    static AddSource = class {
        static _getMusicDataFromSourcePath = async sourcePath => {
            const sources = [];
            const supported = [".wav", ".mp3", ".ogg", ".flac"];
            const audioFiles = await fs.promises.readdir(sourcePath);
        
            for (const audioFile of audioFiles) {
                if (!supported.includes(path.extname(audioFile))) continue;
        
                try {
                    const metadata = await parseFile(path.join(sourcePath, audioFile));
                    const { artist, title } = metadata.common;
                    const { duration } = metadata.format;

                    const obj = {
                        sourcepath: sourcePath,
                        filename: audioFile,
                        duration
                    };
        
                    const hasArtist = artist !== undefined && artist.trim() !== "";
                    const hasTitle = title !== undefined && title.trim() !== "";
        
                    if (hasArtist && hasTitle) {
                        obj["artist"] = artist;
                        obj["title"] = title;
                    } else {
                        obj["unfinished"] = true;
                    }
        
                    sources.push(obj);
                } catch {
                    // The file probably wasn't music, or not supported (very unlikely)
                }
            }
    
            let pickedExample = null;
            sources.find(o => {
                if (o.hasOwnProperty("unfinished")) {
                    pickedExample = path.parse(o.filename).name;
                    return true;
                }
            });
            
            return { sources: JSON.stringify(sources), sourcePath, pickedExample };
        }

        static handleSelect = async () => {
            const args = [global.sharedState.mainWindow, { properties: ["openDirectory"] }];
            const { canceled, filePaths } = await dialog.showOpenDialog(...args);
        
            if (canceled) {
                return { sources: null, sourcePath: null, pickedExample: null };
            }
            
            return await Modal.AddSource._getMusicDataFromSourcePath(filePaths[0]);
        }
    
        static _fetchTrackDataFromSource = async sources => {
            for (let i = 0; i < sources.length; i++) {
                const { artist, title } = sources[i];
                const albumInfo = await Database.getExternalAlbumData(got.get, path.join, artist.trim(), title.trim());

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

            return sources;
        }

        static _putTracksDataFromSourceIntoDB = async (sources, sourcePath) => {
            const artistNames = new Set();
            const albumData = {};
            const trackData = [];

            // Creating 3 different data structures to complete DB insert (with
            // data dependencies)
            for (const source of sources) {
                const { filename, artist, duration, title, albumName, img } = source;
                
                artistNames.add(artist);

                if (albumName !== undefined) {
                    const albumKey = artist + "%" + albumName;
                    albumData[albumKey] = { img, artist };
                }

                trackData.push({
                    filename: filename,
                    name: title,
                    duration: duration,
                    albumname: albumName,
                    artistname: artist,
                    sourcepath: sourcePath
                });
            }

            Database.addSource(sourcePath, path.basename(sourcePath));
            Database.addArtists(artistNames);
            Database.addAlbums(albumData);
            Database.addTracks(trackData);
        }

        static finalizeMusicDataFromSourcePath = (checkedRadioID, isReversed, sources, sourcePath) => {
            sources = JSON.parse(sources);
            
            for (let i = 0; i < sources.length; i++) {
                let { filename, unfinished } = sources[i];

                if (unfinished) {
                    delete sources[i]["unfinished"];
                    filename = path.parse(filename).name;

                    switch (checkedRadioID) {
                        case "inpTrack":
                            sources[i]["title"] = filename.trim();
                            break;
                        case "inpArtist":
                            sources[i]["artist"] = filename.trim();
                            break;
                        case "inpTrackArtist":
                            let parts = filename.split(" - ");
    
                            if (isReversed) {
                                sources[i]["title"] = parts[0].trim();
                                sources[i]["artist"] = parts[1].trim();
                            } else {
                                sources[i]["title"] = parts[1].trim();
                                sources[i]["artist"] = parts[0].trim();
                            }
                            break;
                    }
                }
            }

            new Promise(async (res, rej) => {
                const data = await Modal.AddSource._fetchTrackDataFromSource(sources);
                Modal.AddSource._putTracksDataFromSourceIntoDB(data, sourcePath);
                res(true);
            });
            
            return { sources, sourcePath };
        }
    }

    static AddPlaylist = class {
        //
    }
}

const registerRendererHandlers = () => {
    ipcMain.handle("requestTemplate", async (e, name) => {
        return await Modal.requestTemplate(name);
    });
    ipcMain.handle("requestDatabaseInteraction", async (...args) => {
        return await Database.handleAction(...args);
    });
    ipcMain.handle("folderSelectSource", async () => {
        return await Modal.AddSource.handleSelect();
    });
    ipcMain.handle("finalizeSourceFiles", async (e, checkedRadioID, isReversed, sources, sourcePath) => {
        return Modal.AddSource.finalizeMusicDataFromSourcePath(checkedRadioID, isReversed, sources, sourcePath);
    });
}

module.exports = { registerRendererHandlers };
