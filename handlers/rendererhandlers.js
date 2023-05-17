const { ipcMain } = require("electron");
const { ModalTemplate, ModalAddSource, ModalAddPlaylist } = require("../app/fullplayer/templates/templatehandlers");

const registerRendererHandlers = () => {
    ipcMain.handle("requestTemplate", async (e, name) => {
        return await ModalTemplate.request(name);
    });
    ipcMain.handle("folderSelectSource", async () => {
        return await ModalAddSource.handleSelect();
    });
    ipcMain.handle("finalizeSourceFiles", async (e, checkedRadioID, isReversed, sources, sourcePath) => {
        return ModalAddSource.finalizeMusicDataFromSourcePath(checkedRadioID, isReversed, sources, sourcePath);
    });
}

module.exports = { registerRendererHandlers };
