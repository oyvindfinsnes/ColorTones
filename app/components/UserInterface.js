class UI {
    static init() {
        this.modal = document.querySelector(".modal");

        this.btnAddSource = document.querySelector("#btnAddSource");
        this.sourcesItems = document.querySelector(".sources-items");
        this.btnAddPlaylist = document.querySelector("#btnAddPlaylist");
        this.playlistsItems = document.querySelector(".playlists-items");

        this.trackTitle = document.querySelector(".track-details .track-title");
        this.trackArtist = document.querySelector(".track-details .track-artist");
        this.inpTimeline = document.querySelector("#inpTimeline");
        this.timeElapsed = document.querySelector(".time-elapsed");
        this.timeTotal = document.querySelector(".time-total");
        this.btnSkipPrevious = document.querySelector("#btnSkipPrevious");
        this.btnPlay = document.querySelector("#btnPlay");
        this.btnSkipNext = document.querySelector("#btnSkipNext");
        this.inpVolume = document.querySelector("#inpVolume");

        this.isTimelineSeeking = false;

        this._setupListeners();
    }

    static _setupListeners() {
        // Modal
        window.addEventListener("modalAddSourceFinished", e => UI.Modal.handleAddSourceFinished(e));

        // Topbar
        document.querySelector("#btnMinimize").addEventListener("click", () => window.electronAPI.minimizeWindow());
        document.querySelector("#btnMaximize").addEventListener("click", () => window.electronAPI.maximizeWindow());
        document.querySelector("#btnClose").addEventListener("click", () => window.electronAPI.closeWindow());

        // Navbar
        UI.btnAddSource.querySelector("img").addEventListener("click", () => UI.Modal.handleOpen("newSourceModal"));

        // Playbar
        AudioPlayer.audio.addEventListener("durationchange", () => UI.Playbar.handleTrackDetailsChange());
        AudioPlayer.audio.addEventListener("timeupdate", () => UI.Playbar.handleTimelineUpdate());

        UI.btnSkipPrevious.addEventListener("click", () => UI.Playbar.handleSkipPrevious());
        UI.btnPlay.addEventListener("click", () => UI.Playbar.handlePlaystate());
        UI.btnSkipNext.addEventListener("click", () => UI.Playbar.handleSkipNext());

        UI.inpTimeline.addEventListener("mousedown", () => UI.isTimelineSeeking = true);
        UI.inpTimeline.addEventListener("change", () => UI.Playbar.handleTimelineChange());
        [...document.querySelectorAll(".slider")].forEach(slider => { slider.addEventListener("input", e => UI.Playbar.handleSliderChange(e)) });
    }

    static _formatSecondsToTimestamp(seconds) {
        const t = Math.floor(seconds);
        const h = Math.floor(t / 3600);
        const m = Math.floor(t / 60) % 60;
        const s = t % 60;
    
        return h
            ? `${h}:${m >= 10 ? m : "0" + m}:${s >= 10 ? s : "0" + s}`
            : `${m}:${s >= 10 ? s : "0" + s}`;
    }

    static Modal = class {
        static async handleOpen(templateName) {
            const template = await window.electronAPI.requestTemplate(templateName);
            const regex = new RegExp(/<script>[\s\S]*<\/script>/, "m");
            
            const templateScript = template.match(regex)[0];
            const templateContent = template.replace(regex, "");
            
            // Add the style and markup from template
            UI.modal.innerHTML = templateContent;
        
            // Dynamically add script to the body from template
            const tempSpan = document.createElement("SPAN");
            tempSpan.innerHTML = templateScript;
            const scriptElement = document.createElement("SCRIPT");
            scriptElement.id = Math.random();
            scriptElement.innerHTML = tempSpan.firstChild.textContent;
            document.body.appendChild(scriptElement);
        
            UI.modal.classList.add("active");
        }

        static async handleAddSourceFinished(e) {
            UI.modal.innerHTML = "";
            UI.modal.classList.remove("active");
            // Only the removable scripts will have an ID
            [...document.querySelectorAll("script")].forEach(script => {
                if (script.id !== "") document.body.removeChild(script);
            });
            
            const args = [e.detail.checkedRadioID, e.detail.isReversed, e.detail.sources, e.detail.sourcePath];
            const sources = await window.electronAPI.finalizeSourceFiles(...args);
            //AudioPlayer.updateAudioSources(e.detail.sources);
            //AudioPlayer.updateCurrentSource(targetDir);
            //UI.Modal.handleDisplaySources();
        }

        /* static handleDisplaySources() {
            const sources = AudioPlayer.audioSources;

            for (const source in sources) {
                const path = sources[source].basePath + "/" + source;
            }
        } */
    }

    static Navbar = class {
        static handleSourcesUpdated() {

        }
    }

    static Playbar = class {
        static handleTrackDetailsChange() {
            const { title, artist, duration } = AudioPlayer.getCurrentTrackDetails();
            const elapsed = UI._formatSecondsToTimestamp(0);
            const total = UI._formatSecondsToTimestamp(duration);

            UI.inpTimeline.max = duration;

            UI.trackTitle.textContent = title;
            UI.trackArtist.textContent = artist;
            UI.timeElapsed.textContent = elapsed;
            UI.timeTotal.textContent = total;
        }

        static handleTimelineUpdate() {
            if (!UI.isTimelineSeeking) {
                const elapsed = AudioPlayer.audio.currentTime;
                
                UI.inpTimeline.value = elapsed;
                UI.inpTimeline.dispatchEvent(new Event("input"));
            }

            if (AudioPlayer.audio.currentTime === AudioPlayer.audio.duration) {
                AudioPlayer.skipNext();
            }
        }

        static handleSkipPrevious() {
            AudioPlayer.skipPrevious();
        }

        static handlePlaystate() {
            const isPaused = AudioPlayer.togglePlaystate();
            
            const btn = UI.btnPlay.firstElementChild;
            const { playsrc, pausesrc } = btn.dataset;
            btn.src = isPaused ? playsrc : pausesrc;
        }

        static handleSkipNext() {
            AudioPlayer.skipNext();
        }

        static handleTimelineChange() {
            const pickedTime = UI.inpTimeline.value;
            AudioPlayer.audio.currentTime = pickedTime;
            UI.isTimelineSeeking = false;
        }

        static handleSliderChange(e) {
            const slider = e.currentTarget;

            if (slider.id === UI.inpVolume.id) {
                AudioPlayer.setVolume(document.querySelector("#inpVolume").value);
            }

            if (slider.id === UI.inpTimeline.id) {
                const elapsed = UI.inpTimeline.value;
                const timestamp = UI._formatSecondsToTimestamp(elapsed);
                UI.timeElapsed.textContent = timestamp;
            }
        
            const percent = (parseInt(slider.value) / parseInt(slider.max)) * 100;
            const style = `var(--slider-filled-background-color) ${percent}%,rgba(255, 255, 255, 0.4) ${percent}%`;
            slider.setAttribute("style",  `background: linear-gradient(to right, ${style})`);
        }
    }
};
