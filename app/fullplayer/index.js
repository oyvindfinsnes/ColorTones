// Handlers ====================================================================

const handleModalOpen = async templateName => {
    const template = await window.electronAPI.requestTemplate(templateName);
    const regex = new RegExp(/<script>[\s\S]*<\/script>/, "m");
    
    const templateScript = template.match(regex)[0];
    const templateContent = template.replace(regex, "");
    
    // Add the style and markup from template
    document.querySelector(".modal").innerHTML = templateContent;

    // Dynamically add script to the body from template
    const tempSpan = document.createElement("SPAN");
    tempSpan.innerHTML = templateScript;
    const scriptElement = document.createElement("SCRIPT");
    scriptElement.id = Math.random();
    scriptElement.innerHTML = tempSpan.firstChild.textContent;
    document.body.appendChild(scriptElement);

    document.querySelector(".modal").classList.add("active");
};

const handleModalAddSourceFinished = async e => {
    document.querySelector(".modal").innerHTML = "";
    document.querySelector(".modal").classList.remove("active");
    // Only the removable scripts will have an ID
    [...document.querySelectorAll("script")].forEach(script => {
        if (script.id !== "") document.body.removeChild(script);
    });
    
    const { checkedRadioID, isReversed, targetDir } = e.detail;

    const sources = await window.electronAPI.finalizeSourceFiles(checkedRadioID, isReversed, targetDir);
    AudioPlayer.updateAudioSources(sources);
    AudioPlayer.updateCurrentSource(targetDir);
};

const handleSliderChange = slider => {
    if (slider.id === "inpVolume") {
        AudioPlayer.setVolume(document.querySelector("#inpVolume").value);
    }

    const percent = (parseInt(slider.value) / parseInt(slider.max)) * 100;
    const parts = [
        "var(--slider-filled-background-color) 0%",
        `var(--slider-filled-background-color) ${percent}%`,
        `rgba(255, 255, 255, 0.4) ${percent}%`,
        "rgba(255, 255, 255, 0.4) 100%"
    ];

    slider.setAttribute("style",  `background: linear-gradient(to right, ${parts.join(",")})`);
};

const handlePlaystate = () => {
    const paused = AudioPlayer.audio.paused;

    AudioPlayer.togglePlaystate();
};

// Init ========================================================================

const setupListeners = () => {
    // General
    window.addEventListener("modalAddSourceFinished", e => {
        handleModalAddSourceFinished(e);
    });

    // Topbar
    document.querySelector("#btnMinimize").addEventListener("click", () => {
        window.electronAPI.minimizeWindow();
    });
    document.querySelector("#btnMaximize").addEventListener("click", () => {
        window.electronAPI.maximizeWindow();
    });
    document.querySelector("#btnClose").addEventListener("click", () => {
        window.electronAPI.closeWindow();
    });

    // Navbar
    document.querySelector(".locations-title img").addEventListener("click", async () => {
        handleModalOpen("newSourceModal");
    });

    // Playbar
    [...document.querySelectorAll(".slider")].forEach(slider => {
        slider.addEventListener("input", () => handleSliderChange(slider));
    });

    document.querySelector(".button.play").addEventListener("click", () => {
        handlePlaystate();
    });
};

const disableBuiltinMediaKeys = () => {
    navigator.mediaSession.setActionHandler("play", () => { return false });
    navigator.mediaSession.setActionHandler("pause", () => { return false });
    navigator.mediaSession.setActionHandler("seekbackward", () => { return false });
    navigator.mediaSession.setActionHandler("seekforward", () => { return false });
    navigator.mediaSession.setActionHandler("previoustrack", () => { return false });
    navigator.mediaSession.setActionHandler("nexttrack", () => { return false });
};

const initComponents = () => {
    AudioPlayer.init();
    UserInterface.init();
}

const setup = async () => {
    initComponents();
    setupListeners();
    disableBuiltinMediaKeys();
    Utilities.applyBackgroundAnimation();
};

window.addEventListener("DOMContentLoaded", () => setup());
