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
        this.currentSource = null;
        this.playMode = this.PLAYMODE_STANDARD;
        
        this.isPlaystateFading = false;
    }

    // Private members =========================================================

    static _beforeExit() {
        // save current track
    }

    static _generateQueues(regenerate = false) {
        const generatedItems = 20;
        const shuffleQueue = [];
        const standardQueue = [];
        const trackIDs = Object.keys(this.audioSources[this.currentSource].tracks);
        const totalTracks = trackIDs.length;
        const continuingIndex = trackIDs.findIndex(trackID => trackID === this.standardQueue.at(-1));
        let standardQueueIndex = regenerate ? 0 : continuingIndex + 1;

        for (let i = 0; i < generatedItems; i++) {
            const shuffleItem = trackIDs[Math.floor(Math.random() * totalTracks)];
            shuffleQueue.push(shuffleItem);

            if (standardQueueIndex > totalTracks - 1) standardQueueIndex = 0;
            const standardItem = trackIDs[standardQueueIndex];
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

    static _pickNextTrack() {
        if (this.playMode === this.PLAYMODE_STANDARD) {
            const nextItem = this.standardQueue.shift();
            this.trackHistory.push(nextItem);
            return nextItem;
        }
    }

    static _getAudioSrcFromTrackID(id) {
        const baseName = this.audioSources[this.currentSource].basePath;
        const fileName = this.audioSources[this.currentSource].tracks[id].fileName;
        return baseName + "/" + fileName;
    }

    static _handlePlaystateFading(operator) {
        const step = this.volume / 10;

        const fadeOut = () => {
            this.isPlaystateFading = true;

            if (this.audio.volume - step > 0) {
                this.audio.volume -= step;
                setTimeout(fadeOut, 10);
            } else {
                this.audio.pause();
                this.isPlaystateFading = false;
            }
        };

        const fadeIn = () => {
            this.audio.play();
            this.isPlaystateFading = true;

            if (this.audio.volume + step < this.volume) {
                this.audio.volume += step;
                setTimeout(fadeIn, 10);
            } else {
                this.isPlaystateFading = false;
            }
        };

        if (operator === "+") fadeIn();
        else if (operator === "-") fadeOut();
    }

    // Public members ==========================================================
    
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

    static togglePlaystate() {
        if (this.isPlaystateFading) return false;

        if (this.audio.paused) {
            if (this.audio.src === "") {
                const nextTrackID = this._pickNextTrack();
                const audioSrc = this._getAudioSrcFromTrackID(nextTrackID);
                this.audio.src = audioSrc;
            }

            this._handlePlaystateFading("+");
        } else {
            this._handlePlaystateFading("-");
        }
    }

    static skipNext() {
        /*  */
    }

    static skipPrevious() {
        /*  */
    }

    static updateCurrentSource(source) {
        this.currentSource = source;
        this._generateQueues(true);
    }

    static updateAudioSources(sources) {
        if (Object.keys(sources).length > 0) {
            this.audioSources = sources;
        } else {
            throw new Error("AudioPlayer.js: Sources invalid");
        }
    }
};
