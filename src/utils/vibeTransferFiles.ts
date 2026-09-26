// AIポーション（Vibe Transfer）の参照画像を、選択されたファイルから
// VibeTransferImage（カード1枚分）へ変換する共通処理。単一プロンプト用
// （useVibeTransfer）と複数プロンプト連続生成の行ごと・全行一括
// （useQueueItems）の両方から使う。
import type { VibeTransferImage } from '../types/domain';
import { parseNaiv4VibeFile } from './naiv4vibe';

// 画像アップロード時のInformation Extracted・Reference Strengthの既定値
// （公式サイトの既定値に合わせている）。
export const DEFAULT_INFORMATION_EXTRACTED = 1;
export const DEFAULT_REFERENCE_STRENGTH = 0.6;

// 選択された画像ファイルをbase64文字列（data URLのprefixなし）に変換する。
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('画像の読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}

// 画像ファイル1枚を参照画像カード1枚に変換する。
export async function readVibeTransferImageFile(file: File): Promise<VibeTransferImage> {
  return {
    id: window.crypto.randomUUID(),
    image: await fileToBase64(file),
    informationExtracted: DEFAULT_INFORMATION_EXTRACTED,
    referenceStrength: DEFAULT_REFERENCE_STRENGTH,
    source: 'image',
  };
}

// NovelAI公式サイトが出力する「ポーションセット」ファイル（.naiv4vibe /
// .naiv4vibeBundle）を読み込み、含まれるvibeデータごとに参照画像カードへ変換する。
export async function readVibeTransferSetFile(file: File): Promise<VibeTransferImage[]> {
  const entries = await parseNaiv4VibeFile(file);
  return entries.map((entry) => ({
    id: window.crypto.randomUUID(),
    image: entry.encoding,
    informationExtracted: entry.informationExtracted,
    // ファイルに公式サイトでのReference Strength（importInfo.strength）が
    // 記録されていればそれを引き継ぎ、無い場合のみ既定値を使う。
    referenceStrength: entry.referenceStrength ?? DEFAULT_REFERENCE_STRENGTH,
    source: 'vibeFile' as const,
  }));
}

// 全行一括追加のように同じファイルを複数箇所へ追加する場合、行ごとに独立して
// 強度調整・削除できるよう、idだけを振り直したコピーを作る。
export function withNewIds(images: VibeTransferImage[]): VibeTransferImage[] {
  return images.map((image) => ({ ...image, id: window.crypto.randomUUID() }));
}
