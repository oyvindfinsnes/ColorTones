class ModalTemplate {
    static request = async (name, pathjoin, fsreadfile) => {
        const template = pathjoin(__dirname, "../", "templates", name + ".html");
        return await fsreadfile(template, "utf8");
    }
}

class ModalAddSource {
    static handleSelect = async (dialog, win, fsreaddir, pathmodule, parseFile) => {
        const { canceled, filePaths } = await dialog.showOpenDialog(win, { properties: ["openDirectory"] });
    
        if (canceled) {
            return { sources: null, sourcePath: null, pickedExample: null };
        }
        
        const args = [filePaths[0], fsreaddir, pathmodule, parseFile];
        return await ModalAddSource.getMusicDataFromSourcePath(...args);
    }

    static getMusicDataFromSourcePath = async (sourcePath, fsreaddir, pathmodule, parseFile) => {
        const sources = [];
        const supported = [".wav", ".mp3", ".ogg", ".flac"];
        const audioFiles = await fsreaddir(sourcePath);
    
        for (const audioFile of audioFiles) {
            if (!supported.includes(pathmodule.extname(audioFile))) continue;
    
            try {
                const metadata = await parseFile(pathmodule.join(sourcePath, audioFile));
                const { artist, title } = metadata.common;
                const obj = { fileName: audioFile };
    
                const hasArtist = artist !== undefined && artist.trim() !== "";
                const hasTitle = title !== undefined && title.trim() !== "";
    
                if (hasArtist && hasTitle) {
                    obj["artist"] = metadata.common.artist;
                    obj["title"] = metadata.common.title;
                } else {
                    obj["unfinished"] = true;
                }
                
                /* else {
                    const { name } = path.parse(audioFile);
                    const [artist, title] = name.split(" - ");
                    obj["artist"] = artist;
                    obj["title"] = title;
                } */
    
                sources.push(obj);
            } catch {
                // The file probably wasn't music, or not supported (very unlikely)
            }
        }

        let pickedExample = null;
        sources.find(o => {
            if (o.hasOwnProperty("unfinished")) {
                pickedExample = pathmodule.parse(o.fileName).name;
                return true;
            }
        });
        
        return { sources: JSON.stringify(sources), sourcePath, pickedExample };
    }

    static finalizeMusicDataFromSourcePath = async (checkedRadioID, isReversed, sources, sourcePath) => {
        console.log(checkedRadioID, isReversed, sourcePath);

        /* Object.keys(sources[targetDir].tracks).forEach(trackID => {
            const target = sources[targetDir].tracks[trackID];
            if (target.hasOwnProperty("unfinished")) {
                delete sources[targetDir].tracks[trackID]["unfinished"];
                const fileName = path.parse(sources[targetDir].tracks[trackID].fileName).name;
                
                switch (checkedRadioID) {
                    case "inpTrack":
                        sources[targetDir].tracks[trackID].title = fileName.trim();
                        break;
                    case "inpArtist":
                        sources[targetDir].tracks[trackID].artist = fileName.trim();
                        break;
                    case "inpTrackArtist":
                        let parts = fileName.split("-");
                        
                        if (parts.length > 2) {
                            const first = parts.shift();
                            const last = parts.join("-");
                            parts = [first, last];
                        }

                        if (isReversed) {
                            sources[targetDir].tracks[trackID].title = parts[0].trim();
                            sources[targetDir].tracks[trackID].artist = parts[1].trim();
                        } else {
                            sources[targetDir].tracks[trackID].title = parts[1].trim();
                            sources[targetDir].tracks[trackID].artist = parts[0].trim();
                        }
                        break;
                }
            }
        });

        return sources; */
    }
}

class ModalAddPlaylist {
    //
}

module.exports = { ModalTemplate, ModalAddSource, ModalAddPlaylist };
