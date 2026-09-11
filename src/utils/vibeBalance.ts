import type { VibeTransferImage } from '../types/domain';

// NovelAI公式サイトの「参照強度をバランス調整」ボタンと同等の処理。
// 各参照画像のReference Strengthの比率を保ったまま、合計が1になるよう
// 正規化する（画像が増えるほど1枚あたりの影響が強くなりすぎるのを防ぐための
// 機能）。全ての値が0（合計が0）の場合は比率を保てないため、代わりに
// 均等（1/枚数）に割り振る。画像が0枚の場合は何もしない。
export function balanceVibeTransferImages(images: VibeTransferImage[]): VibeTransferImage[] {
  if (images.length === 0) return images;

  const total = images.reduce((sum, image) => sum + image.referenceStrength, 0);
  if (total === 0) {
    const equal = 1 / images.length;
    return images.map((image) => ({ ...image, referenceStrength: equal }));
  }

  return images.map((image) => ({ ...image, referenceStrength: image.referenceStrength / total }));
}
