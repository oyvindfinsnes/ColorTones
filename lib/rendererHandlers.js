const { dialog, ipcMain, BrowserWindow } = require("electron");
const { parseFile } = require("music-metadata");
const path = require("path");
const fs = require("fs");

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
            
            const sourcePath = filePaths[0].replace(/\\/g, "/");
            return await Modal.AddSource._getMusicDataFromSourcePath(sourcePath);
        }
    
        static _fetchTrackDataFromSource = async sources => {
            for (let i = 0; i < sources.length; i++) {
                const args = [sources[i].artist.trim(), sources[i].title.trim()];
                const albumInfo = await global.sharedState.database.getExternalAlbumData(...args);

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

        static _putTracksDataFromSourceIntoDB = async (sources, normalizedGains, sourcePath) => {
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
                    normalizedgain: normalizedGains[filename],
                    albumname: albumName,
                    artistname: artist,
                    sourcepath: sourcePath
                });
            }

            global.sharedState.database.addSource(sourcePath, path.basename(sourcePath));
            global.sharedState.database.addArtists(artistNames);
            global.sharedState.database.addAlbums(albumData);
            global.sharedState.database.addTracks(trackData);
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

            /* 
                Making a temporary window to use the built-in Web Audio API
                AudioContext when processing the files, resulting in a gain value
                per file that is applied on runtime to adjust all the volumes
                into being more equal to each other (audio normalization)
            */
            const initiateRequestNormalizedGains = () => {
                return new Promise(resolve => {
                    let processingWindow = new BrowserWindow({
                        show: false,
                        webPreferences: { preload: path.join(__dirname, "..", "preload.js") }
                    });

                    const content = `
                        data:text/html;charset=utf-8,
                        <body>
                            <script src="core/components/Utilities.js"></script>
                            <script>
                                window.electronAPI.handleRequestNormalizedGains(async (e, sources, sourcePath) => {
                                    console.log("we are in here heeheheh");
                                    const args = [sources, sourcePath];
                                    const normalizedGains = await Utilities.AudioNormalizer.getNormalizedGainsFromSources(...args);
                                    window.electronAPI.provideNormalizedGains(normalizedGains);
                                });
                            </script>
                        </body>
                    `;
                    
                    processingWindow.loadURL(content, { baseURLForDataURL: `file://${__dirname}/../app/` });

                    processingWindow.once("ready-to-show", () => {
                        ipcMain.on("provideNormalizedGains", (e, normalizedGains) => {
                            processingWindow.close();
                            processingWindow = null;
                            
                            resolve(normalizedGains);
                        });
    
                        const args = ["handleRequestNormalizedGains", sources, sourcePath];
                        processingWindow.webContents.send(...args);    
                    });
                });
            }

            // Inline promise to make sure the unprocessed sources are immediately
            // returned, then providing the full data later when it has processed
            new Promise(async resolve => {
                const results = await Promise.all([
                    Modal.AddSource._fetchTrackDataFromSource(sources),
                    initiateRequestNormalizedGains()
                ]);

                const args = [results[0], results[1], sourcePath];
                Modal.AddSource._putTracksDataFromSourceIntoDB(...args);
                
                resolve(true);
            });
            
            return { sources, sourcePath };
        }
    }

    static AddPlaylist = class {
        //
    }
}

const registerRendererHandlers = () => {
    ipcMain.handle("requestAudioPlayerData", e => {
        return global.sharedState.config.getAudioPlayerData();
    });
    ipcMain.handle("requestTemplate", async (e, name) => {
        return await Modal.requestTemplate(name);
    });
    ipcMain.handle("requestDatabaseInteraction", async (...args) => {
        return await global.sharedState.database.handleAction(...args);
    });
    ipcMain.handle("folderSelectSource", async () => {
        return await Modal.AddSource.handleSelect();
    });
    ipcMain.handle("finalizeSourceFiles", async (e, checkedRadioID, isReversed, sources, sourcePath) => {
        return Modal.AddSource.finalizeMusicDataFromSourcePath(checkedRadioID, isReversed, sources, sourcePath);
    });
}

module.exports = { registerRendererHandlers };
