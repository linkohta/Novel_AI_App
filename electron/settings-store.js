const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const userDataDir = app.getPath('userData');

const settingsPath = path.join(userDataDir, 'settings.json');
const chunksPath = path.join(userDataDir, 'chunks.json');
const templatesPath = path.join(userDataDir, 'templates.json');
const queueTemplatesPath = path.join(userDataDir, 'queue-templates.json');
const FAVORITE_PATHS = {
  artist: path.join(userDataDir, 'favorite-artists.json'),
  character: path.join(userDataDir, 'favorite-characters.json'),
};

// パッケージ化されたビルドは読み取り専用の場所（例: Program Files）に
// インストールされるため、生成画像はアプリ自身と同じ場所ではなく、
// 書き込み可能なユーザーごとのディレクトリに置く必要がある。ユーザーは
// settings.outputDir（UIの「保存先フォルダ」選択で設定される）でこれを
// 上書きできる。空/未設定の場合はこの既定値にフォールバックする。
const defaultOutputDir = path.join(app.getPath('documents'), 'NovelAI', 'output');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getOutputDir() {
  const settings = readJson(settingsPath, {});
  return typeof settings.outputDir === 'string' && settings.outputDir.trim()
    ? settings.outputDir
    : defaultOutputDir;
}

module.exports = {
  settingsPath,
  chunksPath,
  templatesPath,
  queueTemplatesPath,
  FAVORITE_PATHS,
  defaultOutputDir,
  readJson,
  writeJson,
  getOutputDir,
};
