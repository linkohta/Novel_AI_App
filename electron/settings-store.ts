import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const userDataDir = app.getPath('userData');

export const settingsPath = path.join(userDataDir, 'settings.json');
export const chunksPath = path.join(userDataDir, 'chunks.json');
export const templatesPath = path.join(userDataDir, 'templates.json');
export const queueTemplatesPath = path.join(userDataDir, 'queue-templates.json');

export type FavoriteKind = 'artist' | 'character';

export const FAVORITE_PATHS: Record<FavoriteKind, string> = {
  artist: path.join(userDataDir, 'favorite-artists.json'),
  character: path.join(userDataDir, 'favorite-characters.json'),
};

// パッケージ化されたビルドは読み取り専用の場所（例: Program Files）に
// インストールされるため、生成画像はアプリ自身と同じ場所ではなく、
// 書き込み可能なユーザーごとのディレクトリに置く必要がある。ユーザーは
// settings.outputDir（UIの「保存先フォルダ」選択で設定される）でこれを
// 上書きできる。空/未設定の場合はこの既定値にフォールバックする。
export const defaultOutputDir = path.join(app.getPath('documents'), 'NovelAI', 'output');

export function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function writeJson(filePath: string, data: any): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getOutputDir(): string {
  const settings = readJson<{ outputDir?: string }>(settingsPath, {});
  return typeof settings.outputDir === 'string' && settings.outputDir.trim()
    ? settings.outputDir
    : defaultOutputDir;
}
