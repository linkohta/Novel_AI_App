import { useState } from 'react';
import type { VibeTransferImage } from '../types/domain';

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
export function useVibeTransfer() {
  const [vibeTransferImages, setVibeTransferImages] = useState<VibeTransferImage[]>([]);

  async function addVibeTransferImage(file: File) {
    const image = await fileToBase64(file);
    setVibeTransferImages((prev) => [
      ...prev,
      {
        id: window.crypto.randomUUID(),
        image,
        informationExtracted: 1,
        referenceStrength: 0.6,
      },
    ]);
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
    removeVibeTransferImage,
    updateVibeTransferImageField,
  };
}
