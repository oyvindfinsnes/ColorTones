const utilities = new Utilities();

// Handlers ====================================================================

const handlePlayPause = e => {
    /* const tgt = e.currentTarget;

    if (tgt.classList.contains("pause")) {

    } */
};

const handleSliderChange = slider => {
    const percent = (parseInt(slider.value) / parseInt(slider.max)) * 100;
    const parts = [
        "var(--slider-filled-background-color) 0%",
        `var(--slider-filled-background-color) ${percent}%`,
        `rgba(255, 255, 255, 0.4) ${percent}%`,
        "rgba(255, 255, 255, 0.4) 100%"
    ];

    slider.setAttribute("style",  `background: linear-gradient(to right, ${parts.join(",")})`);
};

// Init ========================================================================

const setupListeners = () => {
    document.querySelector("#btnMinimize").addEventListener("click", () => window.electronAPI.minimizeWindow());
    document.querySelector("#btnMaximize").addEventListener("click", () => window.electronAPI.maximizeWindow());
    document.querySelector("#btnClose").addEventListener("click", () => window.electronAPI.closeWindow());

    [...document.querySelectorAll(".slider")].forEach(slider => {
        slider.addEventListener("input", () => handleSliderChange(slider));
    });
};

const setup = async () => {
    setupListeners();
    utilities.applyBackgroundAnimation();

    /* const thing = await window.electronAPI.requestTemplate("newSourceModal");
    document.querySelector(".modal").innerHTML = thing; */
};

window.addEventListener("DOMContentLoaded", () => setup());
