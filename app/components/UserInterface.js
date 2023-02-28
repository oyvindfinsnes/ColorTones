class UserInterface {
    static init() {
        this.modal = document.querySelector(".modal");
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
        window.addEventListener("modalAddSourceFinished", e => UserInterface.Modal.handleAddSourceFinished(e));

        // Topbar
        document.querySelector("#btnMinimize").addEventListener("click", () => window.electronAPI.minimizeWindow());
        document.querySelector("#btnMaximize").addEventListener("click", () => window.electronAPI.maximizeWindow());
        document.querySelector("#btnClose").addEventListener("click", () => window.electronAPI.closeWindow());

        // Navbar
        document.querySelector(".locations-title img").addEventListener("click", () => UserInterface.Modal.handleOpen("newSourceModal"));

        // Playbar
        AudioPlayer.audio.addEventListener("durationchange", () => UserInterface.Playbar.handleTrackDetailsChange());
        AudioPlayer.audio.addEventListener("timeupdate", () => UserInterface.Playbar.handleTimelineUpdate());

        UserInterface.btnSkipPrevious.addEventListener("click", () => UserInterface.Playbar.handleSkipPrevious());
        UserInterface.btnPlay.addEventListener("click", () => UserInterface.Playbar.handlePlaystate());
        UserInterface.btnSkipNext.addEventListener("click", () => UserInterface.Playbar.handleSkipNext());

        UserInterface.inpTimeline.addEventListener("mousedown", () => UserInterface.isTimelineSeeking = true);
        UserInterface.inpTimeline.addEventListener("change", () => UserInterface.Playbar.handleTimelineChange());
        [...document.querySelectorAll(".slider")].forEach(slider => { slider.addEventListener("input", e => UserInterface.Playbar.handleSliderChange(e)) });
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
            UserInterface.modal.innerHTML = templateContent;
        
            // Dynamically add script to the body from template
            const tempSpan = document.createElement("SPAN");
            tempSpan.innerHTML = templateScript;
            const scriptElement = document.createElement("SCRIPT");
            scriptElement.id = Math.random();
            scriptElement.innerHTML = tempSpan.firstChild.textContent;
            document.body.appendChild(scriptElement);
        
            UserInterface.modal.classList.add("active");
        }

        static async handleAddSourceFinished(e) {
            UserInterface.modal.innerHTML = "";
            UserInterface.modal.classList.remove("active");
            // Only the removable scripts will have an ID
            [...document.querySelectorAll("script")].forEach(script => {
                if (script.id !== "") document.body.removeChild(script);
            });
            
            const { checkedRadioID, isReversed, targetDir } = e.detail;
        
            const sources = await window.electronAPI.finalizeSourceFiles(checkedRadioID, isReversed, targetDir);
            AudioPlayer.updateAudioSources(sources);
            AudioPlayer.updateCurrentSource(targetDir);
        }
    }

    static Playbar = class {
        static handleTrackDetailsChange() {
            const { title, artist, duration } = AudioPlayer.getCurrentTrackDetails();
            const elapsed = UserInterface._formatSecondsToTimestamp(0);
            const total = UserInterface._formatSecondsToTimestamp(duration);

            UserInterface.inpTimeline.max = duration;

            UserInterface.trackTitle.textContent = title;
            UserInterface.trackArtist.textContent = artist;
            UserInterface.timeElapsed.textContent = elapsed;
            UserInterface.timeTotal.textContent = total;
        }

        static handleTimelineUpdate() {
            if (!UserInterface.isTimelineSeeking) {
                const elapsed = AudioPlayer.audio.currentTime;
                
                UserInterface.inpTimeline.value = elapsed;
                UserInterface.inpTimeline.dispatchEvent(new Event("input"));
            }
        }

        static handleSkipPrevious() {
            AudioPlayer.skipPrevious();
        }

        static handlePlaystate() {
            const paused = AudioPlayer.audio.paused;
        
            AudioPlayer.togglePlaystate();
        }

        static handleSkipNext() {
            AudioPlayer.skipNext();
        }

        static handleTimelineChange() {
            const pickedTime = UserInterface.inpTimeline.value;
            AudioPlayer.audio.currentTime = pickedTime;
            UserInterface.isTimelineSeeking = false;
        }

        static handleSliderChange(e) {
            const slider = e.currentTarget;

            if (slider.id === UserInterface.inpVolume.id) {
                AudioPlayer.setVolume(document.querySelector("#inpVolume").value);
            }

            if (slider.id === UserInterface.inpTimeline.id) {
                const elapsed = UserInterface.inpTimeline.value;
                const timestamp = UserInterface._formatSecondsToTimestamp(elapsed);
                UserInterface.timeElapsed.textContent = timestamp;
            }
        
            const percent = (parseInt(slider.value) / parseInt(slider.max)) * 100;
            const style = `var(--slider-filled-background-color) ${percent}%,rgba(255, 255, 255, 0.4) ${percent}%`;
            slider.setAttribute("style",  `background: linear-gradient(to right, ${style})`);
        }
    }
};
