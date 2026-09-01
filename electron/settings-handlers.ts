import { ipcMain, BrowserWindow, dialog, IpcMainInvokeEvent } from 'electron';
import { readJson, writeJson, settingsPath, getOutputDir } from './settings-store';
import { shell } from 'electron';

export function registerSettingsHandlers(): void {
  ipcMain.handle('load-settings', () => readJson(settingsPath, {}));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipcMain.handle('save-settings', (event: IpcMainInvokeEvent, settings: any) => {
    writeJson(settingsPath, settings);
    return true;
  });

  ipcMain.handle('open-output-folder', () => shell.openPath(getOutputDir()));

  ipcMain.handle('choose-output-folder', async (event: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win as BrowserWindow, {
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });
}
