import { ipcMain, IpcMainInvokeEvent } from 'electron';
import crypto from 'crypto';
import { readJson, writeJson } from './settings-store';

type ListItem = { id: string; [key: string]: any };

// 個別のJSONファイルとして永続化される「名前付きリスト」（チャンク、
// テンプレート、複数プロンプトテンプレート）のすべてで共有される
// load/save/update/delete のIPCハンドラを登録する。各アイテムには
// 生成されたidが付与され、save/updateは（以前の各コレクションごとの
// 明示的なハンドラと同様に）ペイロード全体を無条件に展開するのではなく、
// `fields` に列挙されたフィールドだけを永続化する。
export function registerListHandlers(prefix: string, filePath: string, fields: string[]): void {
  const pick = (item: ListItem): Record<string, any> =>
    Object.fromEntries(fields.map((field) => [field, item[field]]));

  ipcMain.handle(`load-${prefix}`, () => readJson<ListItem[]>(filePath, []));

  ipcMain.handle(`save-${prefix}`, (event: IpcMainInvokeEvent, item: ListItem) => {
    const list = readJson<ListItem[]>(filePath, []);
    list.push({ id: crypto.randomUUID(), ...pick(item) });
    writeJson(filePath, list);
    return list;
  });

  ipcMain.handle(`update-${prefix}`, (event: IpcMainInvokeEvent, item: ListItem) => {
    const list = readJson<ListItem[]>(filePath, []);
    const target = list.find((i) => i.id === item.id);
    if (target) {
      Object.assign(target, pick(item));
      writeJson(filePath, list);
    }
    return list;
  });

  ipcMain.handle(`delete-${prefix}`, (event: IpcMainInvokeEvent, id: string) => {
    const list = readJson<ListItem[]>(filePath, []).filter((i) => i.id !== id);
    writeJson(filePath, list);
    return list;
  });
}
