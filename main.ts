import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import {
  getOutputDir,
  chunksPath,
  templatesPath,
  queueTemplatesPath,
} from './electron/settings-store';
import { buildMenu } from './electron/menu';
import { createWindow } from './electron/window';
import { registerListHandlers } from './electron/list-handlers';
import { registerFavoriteHandlers } from './electron/favorite-handlers';
import { registerSettingsHandlers } from './electron/settings-handlers';
import { registerGenerationHandlers } from './electron/generation-handlers';

app.whenReady().then(() => {
  fs.mkdirSync(getOutputDir(), { recursive: true });
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

registerSettingsHandlers();
registerListHandlers('chunk', chunksPath, ['name', 'text']);
registerListHandlers('template', templatesPath, ['name', 'text']);
registerListHandlers('queue-template', queueTemplatesPath, ['name', 'rows']);
registerFavoriteHandlers();
registerGenerationHandlers();
