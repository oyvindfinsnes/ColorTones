const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

class Config {
    constructor(resourcesPath) {
        this.config = {};
        this.configPath = path.join(resourcesPath, "appsettings.json");
        
        if (fs.existsSync(this.configPath)) {
            const file = fs.readFileSync(this.configPath, { encoding: "utf8" });
            this.config = JSON.parse(file);
        }
    }

    save() {
        return new Promise(resolve => {
            // Register a new instance of this event every time we want to save
            // the config, and then invoke the request for the data itself
            ipcMain.once("receiveAllDataForConfig", (e, data) => {
                this.setAudioPlayerData(data.audio);
                
                const configStr = JSON.stringify(this.config, null, 4);
                fs.writeFileSync(path.join(this.configPath), configStr);
                
                resolve();
            });

            global.sharedState.mainWindow.webContents.send("requestAllDataForConfig");
        });
    }

    getWindowPosition() {
        const position = { x: "center", y: "center" };
        
        if (!this.config.hasOwnProperty("window")) {
            this.config.window = position;
        } else {
            Object.keys(position).forEach(key => {
                if (this.config.window.hasOwnProperty(key)) {
                    position[key] = this.config.window[key];
                } else {
                    this.config.window[key] = position[key];
                }
            });
        }

        return position;
    }

    setWindowPosition(x, y) {
        if (!this.config.hasOwnProperty("window")) {
            this.config.window = {};
        }

        this.config.window.x = x;
        this.config.window.y = y;
    }

    getWindowSize() {
        const size = { width: 1300, height: 750, minWidth: 800, minHeight: 550 };
        
        if (!this.config.hasOwnProperty("window")) {
            this.config.window = size;
        } else {
            Object.keys(size).forEach(key => {
                if (this.config.window.hasOwnProperty(key)) {
                    size[key] = this.config.window[key];
                } else {
                    this.config.window[key] = size[key];
                }
            });
        }

        return size;
    }

    setWindowSize(w, h) {
        if (!this.config.hasOwnProperty("window")) {
            this.config.window = {};
        }

        this.config.window.width = w;
        this.config.window.height = h;
    }

    getAudioPlayerData() {
        const audio = {
            volume: 0.5,
            muted: false,
            repeat: false,
            shuffle: false,
            currentTime: null,
            currentTrack: null,
            currentOrigin: null
        };
        
        if (!this.config.hasOwnProperty("audio")) {
            this.config.audio = audio;
        } else {
            Object.keys(audio).forEach(key => {
                if (this.config.audio.hasOwnProperty(key)) {
                    audio[key] = this.config.audio[key];
                } else {
                    this.config.audio[key] = audio[key];
                }
            });
        }

        return audio;
    }

    setAudioPlayerData(audioData) {
        if (!this.config.hasOwnProperty("audio")) {
            this.config.audio = {};
        }

        this.config.audio.volume = audioData.volume;
        this.config.audio.muted = audioData.muted;
        this.config.audio.repeat = audioData.repeat;
        this.config.audio.shuffle = audioData.shuffle;
        this.config.audio.currentTime = audioData.currentTime;
        this.config.audio.currentTrack = audioData.currentTrack;
        this.config.audio.currentOrigin = audioData.currentOrigin;
    }
}

module.exports = { Config };
