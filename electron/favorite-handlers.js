const { ipcMain } = require('electron');
const crypto = require('crypto');
const { readJson, writeJson, FAVORITE_PATHS } = require('./settings-store');

// お気に入りアーティスト／お気に入りキャラクターは項目形式が異なるため、
// registerListHandlers（fieldsを固定で列挙する方式）ではなく、`kind` ごとに
// パスを切り替えつつペイロードを丸ごとマージする専用ハンドラで実装する。
function registerFavoriteHandlers() {
  ipcMain.handle('load-favorites', (event, kind) => readJson(FAVORITE_PATHS[kind], []));

  ipcMain.handle('save-favorite', (event, { kind, item }) => {
    const favoritesPath = FAVORITE_PATHS[kind];
    const favorites = readJson(favoritesPath, []);
    favorites.push({ id: crypto.randomUUID(), ...item });
    writeJson(favoritesPath, favorites);
    return favorites;
  });

  ipcMain.handle('update-favorite', (event, { kind, item }) => {
    const favoritesPath = FAVORITE_PATHS[kind];
    const favorites = readJson(favoritesPath, []);
    const target = favorites.find((f) => f.id === item.id);
    if (target) {
      Object.assign(target, item);
      writeJson(favoritesPath, favorites);
    }
    return favorites;
  });

  ipcMain.handle('delete-favorite', (event, { kind, id }) => {
    const favoritesPath = FAVORITE_PATHS[kind];
    const favorites = readJson(favoritesPath, []).filter((f) => f.id !== id);
    writeJson(favoritesPath, favorites);
    return favorites;
  });
}

module.exports = { registerFavoriteHandlers };
