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
    UI.init();
};

const setup = () => {
    initComponents();
    disableBuiltinMediaKeys();
};

window.addEventListener("DOMContentLoaded", () => setup());
