const { ipcMain, BrowserWindow, dialog, shell } = require('electron');
const { readJson, writeJson, settingsPath, getOutputDir } = require('./settings-store');

function registerSettingsHandlers() {
  ipcMain.handle('load-settings', () => readJson(settingsPath, {}));

  ipcMain.handle('save-settings', (event, settings) => {
    writeJson(settingsPath, settings);
    return true;
  });

  ipcMain.handle('open-output-folder', () => shell.openPath(getOutputDir()));

  ipcMain.handle('choose-output-folder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });
}

module.exports = { registerSettingsHandlers };
