import { useState } from 'react';
import type { VibeTransferImage } from '../types/domain';
import { parseNaiv4VibeFile } from '../utils/naiv4vibe';

// PickされたPNG/JPEG等の画像ファイルをbase64文字列（data URLのprefixなし）に
// 変換する。FileReader.readAsDataURLの結果から "data:image/png;base64," 等の
// prefix部分を取り除くだけの処理。
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

// 単一プロンプト用の「AIポーション（Vibe Transfer）」セクションのstate＋
// ハンドラ：参照画像一覧の追加・削除・Information Extracted/Reference
// Strengthの変更。useCharacters.tsと同じ構成に合わせている。
// `setStatus`はファイル読み込み失敗時にエラー内容を画面上部のステータス表示へ
// 反映するために使う（渡さなくても動作するが、失敗が画面上に一切表示されず
// 「選択しても反映されない」ように見えてしまうため、App.tsxからは必ず渡すこと）。
export function useVibeTransfer(setStatus?: (status: string) => void) {
  const [vibeTransferImages, setVibeTransferImages] = useState<VibeTransferImage[]>([]);

  async function addVibeTransferImage(file: File) {
    try {
      const image = await fileToBase64(file);
      setVibeTransferImages((prev) => [
        ...prev,
        {
          id: window.crypto.randomUUID(),
          image,
          informationExtracted: 1,
          referenceStrength: 0.6,
          source: 'image',
        },
      ]);
    } catch (err) {
      setStatus?.(`エラー: ${(err as Error).message}`);
    }
  }

  // NovelAI公式サイトが出力する「ポーションセット」ファイル（.naiv4vibe）を
  // 読み込み、含まれるvibeデータをすべて参照画像一覧に追加する。1ファイルに
  // 複数のinformation_extracted値が含まれる場合はそれぞれ個別のカードになる。
  async function addVibeTransferSetFile(file: File) {
    try {
      const entries = await parseNaiv4VibeFile(file);
      setVibeTransferImages((prev) => [
        ...prev,
        ...entries.map((entry) => ({
          id: window.crypto.randomUUID(),
          image: entry.encoding,
          informationExtracted: entry.informationExtracted,
          // ファイルに公式サイトでのReference Strength（importInfo.strength）が
          // 記録されていればそれを引き継ぎ、無い場合のみ既定値0.6を使う。
          referenceStrength: entry.referenceStrength ?? 0.6,
          source: 'vibeFile' as const,
        })),
      ]);
    } catch (err) {
      setStatus?.(`エラー: ${(err as Error).message}`);
    }
  }

  function removeVibeTransferImage(id: string) {
    setVibeTransferImages((prev) => prev.filter((v) => v.id !== id));
  }

  function updateVibeTransferImageField(
    id: string,
    field: 'informationExtracted' | 'referenceStrength',
    value: number
  ) {
    setVibeTransferImages((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  }

  return {
    vibeTransferImages,
    setVibeTransferImages,
    addVibeTransferImage,
    addVibeTransferSetFile,
    removeVibeTransferImage,
    updateVibeTransferImageField,
  };
}
