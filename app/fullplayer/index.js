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

// https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
const getHash = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;

    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
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
