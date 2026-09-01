const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const {
  getOutputDir,
  chunksPath,
  templatesPath,
  queueTemplatesPath,
} = require('./electron/settings-store');
const { buildMenu } = require('./electron/menu');
const { createWindow } = require('./electron/window');
const { registerListHandlers } = require('./electron/list-handlers');
const { registerFavoriteHandlers } = require('./electron/favorite-handlers');
const { registerSettingsHandlers } = require('./electron/settings-handlers');
const { registerGenerationHandlers } = require('./electron/generation-handlers');

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
