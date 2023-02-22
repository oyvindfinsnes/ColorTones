class AudioPlayer {
    constructor() {
        this.audio = new Audio();

        this.standardQueue = [];
        this.shuffleQueue = [];
        this.trackHistory = [];
        
        this.audioSources = {};

        this.setup();
    }

    setup() {
        // populate both queues
    }

    // Private members =========================================================

    _beforeExit() {
        // save current track
    }

    // Public members ==========================================================
    
    togglePlaystate() {
        /*  */
    }

    skipNext() {
        /*  */
    }

    skipPrevious() {
        /*  */
    }

    updateAudioSources(sources) {
        if (Object.keys(sources).length > 0) {
            this.audioSources = sources;
            
            /* this.audio.volume = 0.1;
            const src = this.audioSources["Music"].basePath + "/" + this.audioSources["Music"]["5811200114387554"].fileName;
            this.audio.src = src;
            this.audio.play(); */
        } else {
            throw new Error("AudioPlayer.js: Sources invalid");
        }
    }
};
