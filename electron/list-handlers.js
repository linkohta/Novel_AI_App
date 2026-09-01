const { ipcMain } = require('electron');
const crypto = require('crypto');
const { readJson, writeJson } = require('./settings-store');

// 個別のJSONファイルとして永続化される「名前付きリスト」（チャンク、
// テンプレート、複数プロンプトテンプレート）のすべてで共有される
// load/save/update/delete のIPCハンドラを登録する。各アイテムには
// 生成されたidが付与され、save/updateは（以前の各コレクションごとの
// 明示的なハンドラと同様に）ペイロード全体を無条件に展開するのではなく、
// `fields` に列挙されたフィールドだけを永続化する。
function registerListHandlers(prefix, filePath, fields) {
  const pick = (item) => Object.fromEntries(fields.map((field) => [field, item[field]]));

  ipcMain.handle(`load-${prefix}`, () => readJson(filePath, []));

  ipcMain.handle(`save-${prefix}`, (event, item) => {
    const list = readJson(filePath, []);
    list.push({ id: crypto.randomUUID(), ...pick(item) });
    writeJson(filePath, list);
    return list;
  });

  ipcMain.handle(`update-${prefix}`, (event, item) => {
    const list = readJson(filePath, []);
    const target = list.find((i) => i.id === item.id);
    if (target) {
      Object.assign(target, pick(item));
      writeJson(filePath, list);
    }
    return list;
  });

  ipcMain.handle(`delete-${prefix}`, (event, id) => {
    const list = readJson(filePath, []).filter((i) => i.id !== id);
    writeJson(filePath, list);
    return list;
  });
}

module.exports = { registerListHandlers };
