const { minimizeWindow, maximizeWindow, closeWindow } = window.electronAPI;

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
    document.querySelector("#btnMinimize").addEventListener("click", () => minimizeWindow());
    document.querySelector("#btnMaximize").addEventListener("click", () => maximizeWindow());
    document.querySelector("#btnClose").addEventListener("click", () => closeWindow());

    [...document.querySelectorAll(".slider")].forEach(slider => {
        slider.addEventListener("input", () => handleSliderChange(slider));
    });
};

const setup = () => {
    setupListeners();
    applyBackgroundAnimation();
};

window.addEventListener("DOMContentLoaded", () => setup());
