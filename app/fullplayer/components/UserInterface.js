class UI {
    static init() {
        this.COLORS = {
            bg: "#121212",
            accent1: "#B3005E",
            accent2: "#E90064",
            highlight: "#d72227"
        };

        this.modal = document.querySelector(".modal");

        this.profile = document.querySelector("#profile");
        this.profileDropdown = document.querySelector("#profileDropdown");
        this.profileDropdownOptions = [
            document.querySelector("#dropdownProfile"),
            document.querySelector("#dropdownSettings"),
            document.querySelector("#dropdownQuit")
        ];
        this.btnMinimize = document.querySelector("#btnMinimize");
        this.btnMaximize = document.querySelector("#btnMaximize");
        this.btnClose = document.querySelector("#btnClose");

        this.btnAddSource = document.querySelector("#btnAddSource");
        this.sourcesItems = document.querySelector(".sources-items");
        this.btnAddPlaylist = document.querySelector("#btnAddPlaylist");
        this.playlistsItems = document.querySelector(".playlists-items");

        this.panelContent = document.querySelector("#panelContent");

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

        UI._setupListeners();
        UI.setAppColors();
        UI.Background.activateEffects();
    }

    static _setupListeners() {
        // Modal
        window.addEventListener("modalAddSourceFinished", e => {
            UI.Modal.handleAddSourceFinished(e);
        });

        // Topbar
        UI.profile.addEventListener("click", () => {
            UI.Topbar.handleProfileDropdownOpen();
        });
        UI.profile.addEventListener("mouseleave", () => {
            UI.Topbar.handleProfileDropdownClose();
        });
        UI.profileDropdownOptions.forEach(option => {
            option.addEventListener("click", () => {
                UI.Topbar.handleDropdownOption(option);
            });
        });
        btnMinimize.addEventListener("click", () => {
            window.electronAPI.minimizeWindow();
        });
        btnMaximize.addEventListener("click", () => {
            window.electronAPI.maximizeWindow();
        });
        btnClose.addEventListener("click", () => {
            window.electronAPI.closeWindow();
        });

        // Navbar
        UI.btnAddSource.querySelector("img").addEventListener("click", () => {
            UI.Modal.handleOpen("newSourceModal");
        });
        UI.btnAddPlaylist.querySelector("img").addEventListener("click", () => {
            UI.Modal.handleOpen("newPlaylistModal");
        });

        // Playbar
        UI.btnSkipPrevious.addEventListener("click", () => {
            UI.Playbar.handleSkipPrevious();
        });
        UI.btnPlay.addEventListener("click", () => {
            UI.Playbar.handlePlaystate();
        });
        UI.btnSkipNext.addEventListener("click", () => {
            UI.Playbar.handleSkipNext();
        });
        UI.inpTimeline.addEventListener("mousedown", () => {
            UI.isTimelineSeeking = true;
        });
        UI.inpTimeline.addEventListener("change", () => {
            UI.Playbar.handleTimelineChange();
        });
        [...document.querySelectorAll(".slider")].forEach(slider => {
            slider.addEventListener("input", e => {
                UI.Playbar.handleSliderChange(e);
            });
        });
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

    static setAppColors() {
        const root = document.documentElement;
        const { bg, accent1, accent2, highlight } = UI.COLORS;
        const highlightColorFilter = Utilities.CSSFilterGenerator.compute(highlight);
        
        window.electronAPI.setAppBackground(bg);
        root.style.setProperty("--bg-color", bg);
        root.style.setProperty("--accent1-color", accent1);
        root.style.setProperty("--accent2-color", accent2);
        root.style.setProperty("--highlight-color", highlight);
        root.style.setProperty("--scrollbar-thumb-color", `${highlight}60`);
        root.style.setProperty("--highlight-color-from-filter", highlightColorFilter);
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
            const { sources, sourcePath } = await window.electronAPI.finalizeSourceFiles(...args);
            AudioPlayer.updateAudioSources(sources, sourcePath);
            AudioPlayer.updateCurrentSourcePath(sourcePath);
            UI.MainPanel.rebuildSonglist(sources);
        }
    }

    static Topbar = class {
        static handleProfileDropdownOpen() {
            UI.profileDropdown.classList.add("show");
        }

        static handleProfileDropdownClose() {
            UI.profileDropdown.classList.remove("show");
        }

        static handleDropdownOption(option) {
            if (option.id == "dropdownQuit") window.electronAPI.quitApp();
        }
    }

    static Background = class {
        static activateEffects() {
            const args = [UI.COLORS.accent1, UI.COLORS.accent2];
            Utilities.InterfaceEffects.applyBackgroundAnimation(...args);
        }
    
        static deactivateEffects() {
            Utilities.InterfaceEffects.removeBackgroundAnimation();
        }
    }

    static Navbar = class {
        static handleSourcesUpdated() {
            //
        }
    }

    static MainPanel = class {
        static rebuildSonglist(sources) {
            const totalItems = sources.length;
            const fragment = document.createDocumentFragment();
            const div = document.createElement("DIV");

            for (let i = 0; i < totalItems; i++) {
                const panelItem = div.cloneNode();
                panelItem.classList.add("panel-item");
                
                const songNo = div.cloneNode();
                songNo.textContent = i + 1;
                panelItem.appendChild(songNo);

                const title = div.cloneNode();
                title.textContent = sources[i].title;
                panelItem.appendChild(title);

                const artist = div.cloneNode();
                artist.textContent = sources[i].artist;
                panelItem.appendChild(artist);

                const album = div.cloneNode();
                album.textContent = "album";
                panelItem.appendChild(album);

                const duration = div.cloneNode();
                duration.textContent = UI._formatSecondsToTimestamp(sources[i].duration);
                panelItem.appendChild(duration);
                
                fragment.appendChild(panelItem);
            }

            while (panelContent.firstChild) {
                panelContent.removeChild(panelContent.firstChild);
            }

            panelContent.appendChild(fragment);
        }
    }

    static Playbar = class {
        static handleTrackDetailsChange() {
            const { title, artist, duration } = AudioPlayer.getCurrentTrackItem();
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

            if (AudioPlayer.audio.currentTime == AudioPlayer.audio.duration) {
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

            if (slider.id == UI.inpVolume.id) {
                AudioPlayer.setVolume(document.querySelector("#inpVolume").value);
            }

            if (slider.id == UI.inpTimeline.id) {
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
