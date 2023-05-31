class AudioPlayer {
    static init() {
        this.PLAYMODE_STANDARD = "standard";
        this.PLAYMODE_SHUFFLE = "shuffle";
        this.playMode = this.PLAYMODE_STANDARD;
        this.isRepeating = false;
        
        this.audio = new Audio();
        this.audioCtx = new AudioContext();
        this.audioSource = this.audioCtx.createMediaElementSource(this.audio);
        this.audioGainNode = this.audioCtx.createGain();
        this.volume = 0.1;
        this.currentIndex = 0;
        
        /* 
            The idea is to keep multiple audio sources in memory, since for every
            time the AudioPlayer is requested to fetch tracks from either source
            or playlist, it requires a db call that would be unnecessary to redo
            every time the playing context is switched. The app instead opts for
            a cron job that routinely cleans up unused data
        */
        this.audioSources = {};
        this.trackHistory = [];
        this.shuffleQueue = [];
        this.standardQueue = [];
        this.currentSourcePath = null;
        
        this.isPlaystateFading = false;
        this.regenerateStandardQueueOnNextPlay = false;

        this.audio.volume = this.volume;
        this.audioGainNode.gain.value = 1.0;

        this._setupListeners();
    }

    // Private members =========================================================

    static _setupListeners() {
        this.audioSource.connect(this.audioGainNode);
		this.audioGainNode.connect(this.audioCtx.destination);
        this.audio.addEventListener("durationchange", () => {
            UI.Playbar.handleTrackDetailsChange();
        });
        this.audio.addEventListener("timeupdate", () => {
            this.handleCurrentPlaytime();
            UI.Playbar.handleTimelineUpdate();
        });
    }

    static _beforeExit() {
        // save current track
    }

    static _findSourceIndexFromFilename(filename) {
        return this.audioSources[this.currentSourcePath].findIndex(trackData => {
            return trackData.filename == filename;
        }) + 1;
    }

    static _generateQueues(opts = {}) {
        const hasStandardQueueIndex = opts.hasOwnProperty("standardQueueIndex");
        const skipStandardQueue = opts.hasOwnProperty("skipStandardQueue") && opts.skipStandardQueue;
        const skipShuffleQueue = opts.hasOwnProperty("skipShuffleQueue") && opts.skipShuffleQueue;
        const regenerate = opts.hasOwnProperty("regenerate") && opts.regenerate;

        const shuffleQueue = [];
        const standardQueue = [];
        const tracks = this.audioSources[this.currentSourcePath];
        const totalTracks = tracks.length;
        const generatedItems = totalTracks > 20 ? 20 : totalTracks;
        
        let standardQueueStartIndex = 0;

        if (this.standardQueue.length > 0) {
            const filename = this.standardQueue.at(-1).filename;
            standardQueueStartIndex = this._findSourceIndexFromFilename(filename);
        }

        if (hasStandardQueueIndex) {
            standardQueueStartIndex = opts.standardQueueIndex;
        }

        for (let i = 0; i < generatedItems; i++) {
            const shuffleItem = tracks[Math.floor(Math.random() * totalTracks)];
            shuffleQueue.push(shuffleItem);

            if (standardQueueStartIndex > totalTracks - 1) {
                standardQueueStartIndex = 0;
            }

            const standardItem = tracks[standardQueueStartIndex];
            standardQueue.push(standardItem);
            standardQueueStartIndex++;
        }

        if (!skipStandardQueue) {
            if (regenerate) {
                this.standardQueue = [...standardQueue];
            } else {
                this.standardQueue = [...this.standardQueue, ...standardQueue];
            }
        }

        if (!skipShuffleQueue) {
            if (regenerate) {
                this.shuffleQueue = [...shuffleQueue];
            } else {
                this.shuffleQueue = [...this.shuffleQueue, ...shuffleQueue];
            }
        }
    }

    static _pickPreviousTrack() {
        if (this.currentIndex < this.trackHistory.length - 1) {
            this.currentIndex++;
            
            return {
                gain: this.trackHistory[this.currentIndex].normalizedgain,
                src: this._getTrackPath(this.trackHistory[this.currentIndex])
            };
        }

        return false;
    }

    static _pickNextTrack() {
        if (this.currentIndex == 0) {
            let nextItem = null;

            if (this.playMode == this.PLAYMODE_SHUFFLE) {
                nextItem = this.shuffleQueue.shift();
            } else {
                if (this.regenerateStandardQueueOnNextPlay) {
                    const filename = this.trackHistory[this.currentIndex].filename;
                    const standardQueueIndex = this._findSourceIndexFromFilename(filename);
                    this._generateQueues({ standardQueueIndex, regenerate: true, skipShuffleQueue: true });
                    this.regenerateStandardQueueOnNextPlay = false;
                }

                nextItem = this.standardQueue.shift();
            }

            this.trackHistory.unshift(nextItem);
        } else {
            this.currentIndex--;
        }

        return {
            gain: this.trackHistory[this.currentIndex].normalizedgain,
            src: this._getTrackPath(this.trackHistory[this.currentIndex])
        };
    }

    static _getTrackPath(trackItem) {
        return this.currentSourcePath + "/" + trackItem.filename;
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

    static handleCurrentPlaytime() {
        const { currentTime, duration } = this.audio;

        if (currentTime == duration) {
            if (this.isRepeating) {
                this.audio.currentTime = 0;
                this.togglePlaystate({ forcePlay: true });
            } else {
                this.skipNext();
            }
        }
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
        const trackData = this._pickPreviousTrack();
        
        this.audioGainNode.gain.value = trackData.gain;
        this.audio.src = trackData.src;
        this.togglePlaystate({ forcePlay: true });
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
                const trackData = this._pickNextTrack();
        
                this.audioGainNode.gain.value = trackData.gain;
                this.audio.src = trackData.src;
                this._handlePlaystateFading("+");
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
        const trackData = this._pickNextTrack();
        
        this.audioGainNode.gain.value = trackData.gain;
        this.audio.src = trackData.src;
        this.togglePlaystate({ forcePlay: true });

        if (this.standardQueue.length <= 5 || this.shuffleQueue.length <= 5) {
            this._generateQueues();
        }
    }

    static setPlaymodeStandard() {
        this.playMode = this.PLAYMODE_STANDARD;
        this.regenerateStandardQueueOnNextPlay = true;
    }

    static setPlaymodeShuffle() {
        this.playMode = this.PLAYMODE_SHUFFLE;
    }

    static setRepeat(shouldRepeat = null) {
        if (shouldRepeat == null) {
            this.isRepeating = !this.isRepeating;
        } else {
            this.isRepeating = shouldRepeat;
        }
    }

    static updateCurrentSourcePath(sourcePath) {
        if (this.currentSourcePath != sourcePath) {
            this.currentSourcePath = sourcePath;
            this._generateQueues({ regenerate: true });
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
