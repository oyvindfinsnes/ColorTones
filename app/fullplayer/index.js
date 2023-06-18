const disableBuiltinMediaKeys = () => {
    navigator.mediaSession.setActionHandler("play", () => { return false });
    navigator.mediaSession.setActionHandler("pause", () => { return false });
    navigator.mediaSession.setActionHandler("seekbackward", () => { return false });
    navigator.mediaSession.setActionHandler("seekforward", () => { return false });
    navigator.mediaSession.setActionHandler("previoustrack", () => { return false });
    navigator.mediaSession.setActionHandler("nexttrack", () => { return false });
}

const registerSavingDataForConfigListener = () => {
    window.electronAPI.requestAllDataForConfig(() => {
        window.electronAPI.receiveAllDataForConfig(window.configData);
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    window.configData = await window.electronAPI.requestConfigData();
    
    AudioPlayer.init();
    UI.init();
    disableBuiltinMediaKeys();
    registerSavingDataForConfigListener();
});
