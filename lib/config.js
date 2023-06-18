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
                this.setInterfaceData(data.interface);
                this.setProfileData(data.profile);
                this.setThemesData(data.themes);
                
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

        Object.keys(audioData).forEach(key => {
            this.config.audio[key] = audioData[key];
        });
    }

    getInterfaceData() {
        const appinterface = {
            "backgroundOpacity": 0.3,
            "enableMiniplayer": false,
            "enableBackgroundAnimation": true,
            "enablePlaybarAnimation": true
        };
        
        if (!this.config.hasOwnProperty("interface")) {
            this.config.interface = appinterface;
        } else {
            Object.keys(appinterface).forEach(key => {
                if (this.config.interface.hasOwnProperty(key)) {
                    appinterface[key] = this.config.interface[key];
                } else {
                    this.config.interface[key] = appinterface[key];
                }
            });
        }

        return appinterface;
    }

    setInterfaceData(interfaceData) {
        if (!this.config.hasOwnProperty("interface")) {
            this.config.interface = {};
        }

        Object.keys(interfaceData).forEach(key => {
            this.config.interface[key] = interfaceData[key];
        });
    }

    getProfileData() {
        const profile = {
            "username": "Username",
            "image": "default-profile.png"
        };
        
        if (!this.config.hasOwnProperty("profile")) {
            this.config.profile = profile;
        } else {
            Object.keys(profile).forEach(key => {
                if (this.config.profile.hasOwnProperty(key)) {
                    profile[key] = this.config.profile[key];
                } else {
                    this.config.profile[key] = profile[key];
                }
            });
        }

        return profile;
    }

    setProfileData(profileData) {
        if (!this.config.hasOwnProperty("profile")) {
            this.config.profile = {};
        }

        Object.keys(profileData).forEach(key => {
            this.config.profile[key] = profileData[key];
        });
    }

    getThemesData() {
        let themes = [
            {
                "id": "defaultTheme1",
                "name": "Blood Moon",
                "colors": {
                    "bg": "#161616",
                    "accent1": "#660035",
                    "accent2": "#bb000e",
                    "highlight": "#e31c25"
                },
                "selected": true
            },
            {
                "id": "defaultTheme2",
                "name": "Unicorn Starlight Extravaganza",
                "colors": {
                    "bg": "#420e4e",
                    "accent1": "#9c1b37",
                    "accent2": "#d72227",
                    "highlight": "#fd751f"
                },
                "selected": false
            }
        ];
        
        if (!this.config.hasOwnProperty("themes") || this.config.themes.length < 1) {
            this.config.themes = themes;
        } else {
            themes = this.config.themes;
        }

        return themes;
    }

    setThemesData(themesData) {
        this.config.themes = themesData;
    }
}

module.exports = { Config };
