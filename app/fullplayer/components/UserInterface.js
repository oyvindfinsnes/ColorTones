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

        this.panels = document.querySelector("#panels");

        this.trackTitle = document.querySelector(".track-details .track-title");
        this.trackArtist = document.querySelector(".track-details .track-artist");
        this.inpTimeline = document.querySelector("#inpTimeline");
        this.timeElapsed = document.querySelector(".time-elapsed");
        this.timeTotal = document.querySelector(".time-total");
        this.btnSkipPrevious = document.querySelector("#btnSkipPrevious");
        this.btnPlay = document.querySelector("#btnPlay");
        this.btnSkipNext = document.querySelector("#btnSkipNext");
        this.btnExpand = document.querySelector("#btnExpand");
        this.toggleButtons = [
            document.querySelector("#btnShuffle"),
            document.querySelector("#btnRepeat"),
            document.querySelector("#btnEnhance")
        ];
        this.inpVolume = document.querySelector("#inpVolume");

        this.isTimelineSeeking = false;

        UI._setupListeners();
        UI._init();
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
        UI.btnAddSource.querySelector(".btn-add").addEventListener("click", () => {
            UI.Modal.handleOpen("newSourceModal");
        });
        UI.btnAddPlaylist.querySelector(".btn-add").addEventListener("click", () => {
            UI.Modal.handleOpen("newPlaylistModal");
        });
        [...document.querySelectorAll(".general .general-item")].forEach(item => {
            item.addEventListener("click", () => UI.Navbar.handleLinkClicked(item));
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
        UI.toggleButtons.forEach(toggle => {
            toggle.addEventListener("click", () => {
                toggle.classList.toggle("active");
            });
        });
        [...document.querySelectorAll(".slider")].forEach(slider => {
            slider.addEventListener("input", e => {
                UI.Playbar.handleSliderChange(e);
            });
        });
    }

    static async _init() {
        UI.setAppColors();
        UI.Background.activateEffects();
        
        const sourceItems = await window.electronAPI.requestDatabaseInteraction("getSourceItems");
        for (const sourceItem of sourceItems) {
            UI.Navbar.addSource(sourceItem.path);
        }
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
                if (script.id != "") document.body.removeChild(script);
            });
            
            const args = [e.detail.checkedRadioID, e.detail.isReversed, e.detail.sources, e.detail.sourcePath];
            const { sources, sourcePath } = await window.electronAPI.finalizeSourceFiles(...args);
            
            UI.Navbar.addSource(sourcePath);
            UI.MainPanel.generatePanel(sourcePath, sources);
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
            switch (option.id) {
                case "dropdownProfile":
                    UI.Modal.handleOpen("profileModal");
                    break;
                case "dropdownSettings":
                    UI.Modal.handleOpen("settingsModal");
                    break;
                case "dropdownQuit":
                    window.electronAPI.quitApp();
                    break;
            }
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
        static addSource(sourcePath) {
            const sourceItem = document.createElement("SPAN");
            const name = sourcePath.split(/[\\/]/).pop();
            const panelID = sourcePath.replace(/[\\\/|\:]/g, "");

            sourceItem.textContent = name;
            sourceItem.classList.add("source");
            sourceItem.dataset.targetpanel = panelID;
            sourceItem.dataset.sourcepath = sourcePath;
            sourceItem.addEventListener("click", () => {
                UI.Navbar.handleLinkClicked(sourceItem);
            });
            
            UI.sourcesItems.appendChild(sourceItem);
        }

        static handleLinkClicked(targetLinkItem) {
            [...document.querySelectorAll("[data-targetpanel]")].forEach(linkItem => {
                linkItem.classList.remove("active");

                if (linkItem == targetLinkItem) {
                    linkItem.classList.add("active");
                    UI.MainPanel.handleSwitchActivePanel(linkItem);
                }
            });
        }
    }

    static MainPanel = class {
        static async handleSwitchActivePanel(linkItem) {
            const sourcePath = linkItem.dataset.sourcepath;
            
            let targetPanel = document.querySelector(`#${linkItem.dataset.targetpanel}`);
            if (!document.body.contains(targetPanel)) {
                await UI.MainPanel.generatePanel(sourcePath);
                targetPanel = document.querySelector(`#${linkItem.dataset.targetpanel}`);
            }

            /* if (!AudioPlayer.hasSource(sourcePath)) {
                AudioPlayer.updateAudioSources(sources, sourcePath);
            }
            
            AudioPlayer.updateCurrentSourcePath(sourcePath); */

            [...document.querySelectorAll(".main-panel .panel")].forEach(panel => {
                panel.classList.remove("active");
                if (panel.id == targetPanel.id) panel.classList.add("active");
            });
        }

        static async generatePanel(sourcePath, sources = null) {
            if (sources == null) {
                const args = ["getDataFromSourcePath", sourcePath];
                sources = await window.electronAPI.requestDatabaseInteraction(...args);   
            }

            const totalTracks = sources.length;
            const panelTitle = sourcePath.split(/[\\/]/).pop();
            const sourceID = sourcePath.replace(/[\\\/|\:]/g, "");
            const totalTime = sources.reduce((acc, a) => acc + a.duration, 0);
            const details = `Total Tracks: ${totalTracks}, ${Utilities.formatSecondsToTimestamp(totalTime, true)}`;

            const panel = document.createElement("DIV");
            panel.id = sourceID;
            panel.classList.add("panel");
            
            const panelItems = [];
            for (let i = 0; i < sources.length; i++) {
                panelItems.push(`
                    <div class="panel-item">
                        <div class="panel-button"><img src="../assets/icon/ui/play-white.png" /></div>
                        <div>${i + 1}</div>
                        <div>${sources[i].title}</div>
                        <div>${sources[i].artist}</div>
                        <div>${sources[i].album ? sources[i].album : ""}</div>
                        <div>${Utilities.formatSecondsToTimestamp(sources[i].duration)}</div>
                        <div class="panel-button"><img src="../assets/icon/ui/more.png" /></div>
                    </div>
                `);
            }

            panel.innerHTML = `
                <div class="panel-header-top">
                    <img class="panel-icon" src="../assets/img/default-origin.png">
                    <div>
                        <span class="panel-title">Source: ${panelTitle}</span>
                        <span class="panel-details">${details}</span>
                    </div>
                </div>
                <div class="panel-header-bottom">
                    <div class="panel-button"></div>
                    <div>#</div>
                    <div>
                        <img src="../assets/icon/ui/track.png" />
                        Title
                    </div>
                    <div>
                        <img src="../assets/icon/ui/artist.png" />
                        Artist
                    </div>
                    <div>
                        <img src="../assets/icon/ui/album.png" />
                        Album
                    </div>
                    <div>
                        <img src="../assets/icon/ui/duration.png" />
                        Duration
                    </div>
                    <div class="panel-button"></div>
                </div>
                <div class="panel-content">${panelItems.join("")}</div>
            `;

            UI.panels.appendChild(panel);
        }
    }

    static Playbar = class {
        static handleTrackDetailsChange() {
            const { title, artist, duration } = AudioPlayer.getCurrentTrackItem();
            const elapsed = Utilities.formatSecondsToTimestamp(0);
            const total = Utilities.formatSecondsToTimestamp(duration);

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
                const timestamp = Utilities.formatSecondsToTimestamp(elapsed);
                UI.timeElapsed.textContent = timestamp;
            }
        
            const percent = (parseInt(slider.value) / parseInt(slider.max)) * 100;
            const style = `var(--slider-filled-background-color) ${percent}%,rgba(255, 255, 255, 0.4) ${percent}%`;
            slider.setAttribute("style",  `background: linear-gradient(to right, ${style})`);
        }
    }
};
