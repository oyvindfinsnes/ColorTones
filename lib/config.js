const path = require("path");
const fs = require("fs");

class Config {
    constructor(resourcesPath) {
        this.config = null;
        this.configPath = path.join(resourcesPath, "appsettings.json");
        
        if (fs.existsSync(this.configPath)) {
            const file = fs.readFileSync(this.configPath, { encoding: "utf8" });
            this.config = JSON.parse(file);
        }
    }

    save() {
        const data = JSON.stringify(this.config, null, 4);
        fs.writeFileSync(path.join(this.configPath), data);
    }

    getWindowPosition() {
        const hasWindow = this.config.hasOwnProperty("window");
        const position = { x: "center", y: "center" };
        
        if (!hasWindow) {
            this.config.window = position;
        } else {
            // Create default values for the keys that don't exist, if they exist
            // use the value instead
            ["x", "y"].forEach(key => {
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
        const hasWindow = this.config.hasOwnProperty("window");

        if (!hasWindow) this.config.window = {};

        this.config.window.x = x;
        this.config.window.y = y;
    }

    getWindowSize() {
        const hasWindow = this.config.hasOwnProperty("window");
        const size = { width: 1300, height: 750, minWidth: 800, minHeight: 550 };
        
        if (!hasWindow) {
            this.config.window = size;
        } else {
            // Create default values for the keys that don't exist, if they exist
            // use the value instead
            ["width", "height", "minWidth", "minHeight"].forEach(key => {
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
        const hasWindow = this.config.hasOwnProperty("window");

        if (!hasWindow) this.config.window = {};

        this.config.window.width = w;
        this.config.window.height = h;
    }
}

module.exports = { Config };
