class AudioPlayer {
    static init() {
        this.PLAYMODE_STANDARD = "standard";
        this.PLAYMODE_SHUFFLE = "shuffle";
        
        this.audio = new Audio();
        this.volume = 0;
        this.standardQueue = [];
        this.shuffleQueue = [];
        this.trackHistory = [];        
        this.audioSources = {};
        this.currentIndex = 0;
        this.currentSourcePath = null;
        this.playMode = this.PLAYMODE_STANDARD;
        
        this.isPlaystateFading = false;

        AudioPlayer._setupListeners();
    }

    // Private members =========================================================

    static _setupListeners() {
        AudioPlayer.audio.addEventListener("durationchange", () => {
            UI.Playbar.handleTrackDetailsChange();
        });
        AudioPlayer.audio.addEventListener("timeupdate", () => {
            UI.Playbar.handleTimelineUpdate();
        });
    }

    static _beforeExit() {
        // save current track
    }

    static _generateQueues(regenerate = false) {
        const generatedItems = 20;
        const shuffleQueue = [];
        const standardQueue = [];
        const tracks = this.audioSources[this.currentSourcePath];
        const totalTracks = tracks.length;
        let standardQueueIndex = regenerate
            ? 0
            : tracks.findIndex(obj => obj.filename == this.standardQueue.at(-1).filename) + 1;

        for (let i = 0; i < generatedItems; i++) {
            const shuffleItem = tracks[Math.floor(Math.random() * totalTracks)];
            shuffleQueue.push(shuffleItem);

            if (standardQueueIndex > totalTracks - 1) standardQueueIndex = 0;
            const standardItem = tracks[standardQueueIndex];
            standardQueue.push(standardItem);
            standardQueueIndex++;
        }

        if (!regenerate) {
            this.shuffleQueue = [...this.shuffleQueue, ...shuffleQueue];
            this.standardQueue = [...this.standardQueue, ...standardQueue];
        } else {
            this.shuffleQueue = [...shuffleQueue];
            this.standardQueue = [...standardQueue];
        }
    }

    static _pickPreviousTrack() {
        if (this.currentIndex < this.trackHistory.length - 1) {
            this.currentIndex++;
            return this._getTrackPath(this.trackHistory[this.currentIndex]);
        }

        return false;
    }

    static _pickNextTrack() {
        if (this.currentIndex == 0) {
            let nextItem = null;

            if (this.playMode == this.PLAYMODE_SHUFFLE) {
                nextItem = this.shuffleQueue.shift();
            } else {
                nextItem = this.standardQueue.shift();
            }

            this.trackHistory.unshift(nextItem);
        } else {
            this.currentIndex--;
        }

        return this._getTrackPath(this.trackHistory[this.currentIndex]);
    }

    static _getTrackPath(trackItem) {
        return AudioPlayer.currentSourcePath + "/" + trackItem.filename;
    }

    static _handlePlaystateFading(operator) {
        const fadeMS = 250;
        const volumeStep = this.volume / 10;

        const fadeOut = () => {
            this.isPlaystateFading = true;

            if (this.audio.volume - volumeStep > 0) {
                this.audio.volume -= volumeStep;
                setTimeout(fadeOut, fadeMS / 10);
            } else {
                this.audio.pause();
                this.isPlaystateFading = false;
            }
        };

        const fadeIn = () => {
            this.audio.play();
            this.isPlaystateFading = true;

            if (this.audio.volume + volumeStep < this.volume) {
                this.audio.volume += volumeStep;
                setTimeout(fadeIn, fadeMS / 10);
            } else {
                this.isPlaystateFading = false;
            }
        };

        if (operator === "+") fadeIn();
        else if (operator === "-") fadeOut();
    }

    // Public members ==========================================================
    
    static getCurrentTrackItem() {
        return this.trackHistory[this.currentIndex];
    }

    static setVolume(value, isFloat = false) {
        if (this.isPlaystateFading) return false;

        if (isFloat) {
            if (value >= 0 && value <= 1.0) {
                this.volume = value;
                this.audio.volume = value;
            }
        } else {
            if (value >= 0 && value <= 100) {
                this.volume = value / 100;
                this.audio.volume = value / 100;
            }
        }
    }

    static skipPrevious() {
        const track = this._pickPreviousTrack();
        
        if (track) {
            this.audio.src = track;
            this.togglePlaystate({ forcePlay: true });
        }
    }

    static togglePlaystate(opts = {}) {
        const forcePlay = opts.hasOwnProperty("forcePlay") && opts.forcePlay;
        const forcePause = opts.hasOwnProperty("forcePause") && opts.forcePause;

        if (this.isPlaystateFading) return true;

        if (this.playMode === this.PLAYMODE_STANDARD) {
            if (this.standardQueue.length === 0) return true;
        }

        if (this.playMode === this.PLAYMODE_SHUFFLE) {
            if (this.shuffleQueue.length === 0) return true;
        }

        const play = () => {
            if (this.audio.src !== "") {
                this._handlePlaystateFading("+");
            } else {
                const track = this._pickNextTrack();
        
                if (track) {
                    this.audio.src = track;
                    this._handlePlaystateFading("+");
                }
            }

            return false;
        };

        const pause = () => {
            this._handlePlaystateFading("-");
            return true;
        };

        if (forcePlay || forcePause) {
            return forcePlay ? play() : (forcePause ? pause() : null);
        }

        return this.audio.paused ? play() : pause();
    }

    static skipNext() {
        const track = this._pickNextTrack();
        
        if (track) {
            this.audio.src = track;
            this.togglePlaystate({ forcePlay: true });
        }

        if (this.standardQueue.length <= 5 || this.shuffleQueue.length <= 5) {
            this._generateQueues();
        }
    }

    static setPlaymodeStandard() {
        this.playMode = this.PLAYMODE_STANDARD;
    }

    static setPlaymodeShuffle() {
        this.playMode = this.PLAYMODE_SHUFFLE;
    }

    static updateCurrentSourcePath(sourcePath) {
        if (this.currentSourcePath != sourcePath) {
            this.currentSourcePath = sourcePath;
            this._generateQueues(true);
        }
    }

    static updateAudioSources(sources, sourcePath) {
        if (sources.length > 0) {
            this.audioSources[sourcePath] = sources;
        }
    }

    static async storeSourcesFromSourcePath(sourcePath, forceFetch = false) {
        if (forceFetch || !this.audioSources.hasOwnProperty(sourcePath)) {
            const args = ["getDataFromSourcePath", sourcePath];
            const sources = await window.electronAPI.requestDatabaseInteraction(...args);
            this.updateAudioSources(sources, sourcePath);
        }
    }

    static getSourcePathSources(sourcePath) {
        if (this.audioSources.hasOwnProperty(sourcePath)) {
            return this.audioSources[sourcePath];
        } else {
            return null;
        }
    }
};
