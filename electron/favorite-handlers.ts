import { ipcMain, IpcMainInvokeEvent } from 'electron';
import crypto from 'crypto';
import { readJson, writeJson, FAVORITE_PATHS, FavoriteKind } from './settings-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FavoriteItem = { id: string; [key: string]: any };

// お気に入りアーティスト／お気に入りキャラクターは項目形式が異なるため、
// registerListHandlers（fieldsを固定で列挙する方式）ではなく、`kind` ごとに
// パスを切り替えつつペイロードを丸ごとマージする専用ハンドラで実装する。
export function registerFavoriteHandlers(): void {
  ipcMain.handle('load-favorites', (event: IpcMainInvokeEvent, kind: FavoriteKind) =>
    readJson<FavoriteItem[]>(FAVORITE_PATHS[kind], [])
  );

  ipcMain.handle(
    'save-favorite',
    (
      event: IpcMainInvokeEvent,
      { kind, item }: { kind: FavoriteKind; item: Omit<FavoriteItem, 'id'> }
    ) => {
      const favoritesPath = FAVORITE_PATHS[kind];
      const favorites = readJson<FavoriteItem[]>(favoritesPath, []);
      favorites.push({ id: crypto.randomUUID(), ...item });
      writeJson(favoritesPath, favorites);
      return favorites;
    }
  );

  ipcMain.handle(
    'update-favorite',
    (event: IpcMainInvokeEvent, { kind, item }: { kind: FavoriteKind; item: FavoriteItem }) => {
      const favoritesPath = FAVORITE_PATHS[kind];
      const favorites = readJson<FavoriteItem[]>(favoritesPath, []);
      const target = favorites.find((f) => f.id === item.id);
      if (target) {
        Object.assign(target, item);
        writeJson(favoritesPath, favorites);
      }
      return favorites;
    }
  );

  ipcMain.handle(
    'delete-favorite',
    (event: IpcMainInvokeEvent, { kind, id }: { kind: FavoriteKind; id: string }) => {
      const favoritesPath = FAVORITE_PATHS[kind];
      const favorites = readJson<FavoriteItem[]>(favoritesPath, []).filter((f) => f.id !== id);
      writeJson(favoritesPath, favorites);
      return favorites;
    }
  );
}
