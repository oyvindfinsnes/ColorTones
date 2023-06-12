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
        const data = {
            audio: {
                volume: AudioPlayer.volume.toFixed(5),
                muted: AudioPlayer.audio.muted,
                repeat: AudioPlayer.isRepeating,
                shuffle: AudioPlayer.playMode == AudioPlayer.PLAYMODE_SHUFFLE,
                currentTime: AudioPlayer.audio.currentTime,
                currentTrack: AudioPlayer.trackHistory.length > 0
                    ? AudioPlayer.trackHistory[0].filename
                    : null,
                currentOrigin: AudioPlayer.currentSourcePath
            }
        };
        
        window.electronAPI.receiveAllDataForConfig(data);
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    const configData = {
        audio: await window.electronAPI.requestAudioPlayerData()
    };

    AudioPlayer.init(configData.audio);
    UI.init(configData);
    disableBuiltinMediaKeys();
    registerSavingDataForConfigListener();
});
