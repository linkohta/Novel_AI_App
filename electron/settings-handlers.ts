import { app, ipcMain, BrowserWindow, dialog, IpcMainInvokeEvent } from 'electron';
import fs from 'fs';
import path from 'path';
import { readJson, writeJson, settingsPath, getOutputDir } from './settings-store';
import { shell } from 'electron';

export function registerSettingsHandlers(): void {
  ipcMain.handle('load-settings', () => readJson(settingsPath, {}));

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

  // テンプレート等のtxtエクスポート。保存先はダイアログでユーザーに選ばせる
  // （既定はドキュメントフォルダ）。キャンセル時はnullを返す。
  ipcMain.handle(
    'export-text-file',
    async (event: IpcMainInvokeEvent, { fileName, text }: { fileName: string; text: string }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showSaveDialog(win as BrowserWindow, {
        defaultPath: path.join(app.getPath('documents'), path.basename(fileName)),
        filters: [{ name: 'テキストファイル', extensions: ['txt'] }],
      });
      if (result.canceled || !result.filePath) return null;
      fs.writeFileSync(result.filePath, text, 'utf-8');
      return result.filePath;
    }
  );
}
