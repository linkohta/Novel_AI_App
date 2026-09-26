import { useState } from 'react';
import type { VibeTransferImage } from '../types/domain';
import { balanceVibeTransferImages } from '../utils/vibeBalance';
import { readVibeTransferImageFile, readVibeTransferSetFile } from '../utils/vibeTransferFiles';
import { errorMessage } from '../utils/errorMessage';

// 単一プロンプト用の「AIポーション（Vibe Transfer）」セクションのstate＋
// ハンドラ：参照画像一覧の追加・削除・Information Extracted/Reference
// Strengthの変更。useCharacters.tsと同じ構成に合わせている。
// `setStatus`はファイル読み込み失敗時にエラー内容を画面上部のステータス表示へ
// 反映するために使う（渡さなくても動作するが、失敗が画面上に一切表示されず
// 「選択しても反映されない」ように見えてしまうため、App.tsxからは必ず渡すこと）。
export function useVibeTransfer(setStatus?: (status: string) => void) {
  const [vibeTransferImages, setVibeTransferImages] = useState<VibeTransferImage[]>([]);

  // ファイルを読み込んで一覧の末尾に追加する。読み込み失敗時はステータスに表示する。
  async function appendFrom(read: () => Promise<VibeTransferImage[]>) {
    try {
      const images = await read();
      setVibeTransferImages((prev) => [...prev, ...images]);
    } catch (err) {
      setStatus?.(`エラー: ${errorMessage(err)}`);
    }
  }

  function addVibeTransferImage(file: File) {
    return appendFrom(async () => [await readVibeTransferImageFile(file)]);
  }

  // ポーションセットファイル（.naiv4vibe / .naiv4vibeBundle）に含まれる
  // vibeデータをすべて参照画像一覧に追加する（エンコードごとに個別のカードになる）。
  function addVibeTransferSetFile(file: File) {
    return appendFrom(() => readVibeTransferSetFile(file));
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

  // NovelAI公式サイトの「参照強度をバランス調整」に相当。各画像のReference
  // Strengthの比率を保ったまま合計が1になるよう正規化する。
  function balanceVibeTransferStrengths() {
    setVibeTransferImages((prev) => balanceVibeTransferImages(prev));
  }

  return {
    vibeTransferImages,
    setVibeTransferImages,
    addVibeTransferImage,
    addVibeTransferSetFile,
    removeVibeTransferImage,
    updateVibeTransferImageField,
    balanceVibeTransferStrengths,
  };
}
