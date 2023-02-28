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

    static _pickPreviousTrack() {
        if (this.currentIndex < this.trackHistory.length - 1) {
            this.currentIndex++;
            return this._getTrackPath(this.trackHistory[this.currentIndex]);
        }

        return false;
    }

    static _pickNextTrack() {
        if (this.currentIndex === 0) {
            if (this.playMode === this.PLAYMODE_STANDARD) {
                const nextItem = this.standardQueue.shift();
                this.trackHistory.unshift(nextItem);
            }
        } else {
            this.currentIndex--;
        }

        return this._getTrackPath(this.trackHistory[this.currentIndex]);
    }

    static _getTrackPath(id) {
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
    
    static getCurrentTrackDetails() {
        const currentTrack = this.trackHistory[this.currentIndex];
        return this.audioSources[this.currentSource].tracks[currentTrack];
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
            this._handlePlaystateFading("+");
        }
    }

    static togglePlaystate() {
        if (this.isPlaystateFading) return false;

        if (this.audio.paused) {
            if (this.audio.src !== "") {
                this._handlePlaystateFading("+");
            } else {
                this.skipNext();
            }
        } else {
            this._handlePlaystateFading("-");
        }
    }

    static skipNext() {
        const track = this._pickNextTrack();
        
        if (track) {
            this.audio.src = track;
            this._handlePlaystateFading("+");
        }

        if (this.standardQueue.length <= 5 || this.shuffleQueue.length <= 5) {
            this._generateQueues();
        }
    }

    static updateCurrentSource(source) {
        this.currentSource = source;
        this._generateQueues(true);
    }

    static updateAudioSources(sources) {
        if (Object.keys(sources).length > 0) {
            this.audioSources = sources;
        }
    }
};
