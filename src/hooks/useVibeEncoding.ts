import { useRef } from 'react';
import { isV4Model } from '../../shared/novelai.mjs';
import type { VibeTransferImage } from '../types/domain';

// buildRequestBodyへ渡す最終的な参照画像1件分（image/informationExtracted/
// referenceStrengthのみ。sourceは送信対象外）。
export interface VibeTransferImageInput {
  image: string;
  informationExtracted?: number;
  referenceStrength?: number;
}

// AIポーション（Vibe Transfer）: NovelAI公式サイトはV4系・V5系モデル向けに、
// 参照画像を生のbase64のままではなく、専用API（POST /ai/encode-vibe）で
// 事前エンコードした結果を送信している。生画像のまま送ると公式サイトと
// 大きく異なる生成結果になるため、`source === 'image'`（アップロードした
// 画像そのもの）かつV4系・V5系モデルの場合のみ、生成リクエストの直前に
// このエンコードAPIを呼んでから送信する。`.naiv4vibe`/`.naiv4vibeBundle`
// ファイルから読み込んだデータ（`source === 'vibeFile'`）は既にエンコード
// 済みのため、そのまま送信する。V3系モデルでは仕様上エンコードが不要な
// ため、生画像のまま送信する。
//
// エンコードAPIは1回の呼び出しにつき2 Anlasを消費するため、同じ
// (画像のid, モデル, informationExtracted) の組み合わせに対しては結果を
// メモリ上にキャッシュし、以降は再エンコードせず使い回す
// （Reference Strengthはエンコードに関与しないためキャッシュキーに含めない）。
export function useVibeEncoding(setStatus?: (status: string) => void) {
  const cacheRef = useRef<Map<string, string>>(new Map());

  async function encodeVibeImages(
    images: VibeTransferImage[],
    apiKey: string,
    model: string
  ): Promise<VibeTransferImageInput[]> {
    if (!images.length) return [];

    if (!isV4Model(model)) {
      return images.map((v) => ({
        image: v.image,
        informationExtracted: v.informationExtracted,
        referenceStrength: v.referenceStrength,
      }));
    }

    const result: VibeTransferImageInput[] = [];
    for (const v of images) {
      if (v.source !== 'image') {
        result.push({
          image: v.image,
          informationExtracted: v.informationExtracted,
          referenceStrength: v.referenceStrength,
        });
        continue;
      }

      const cacheKey = `${v.id}:${model}:${v.informationExtracted}`;
      let encoded = cacheRef.current.get(cacheKey);
      if (!encoded) {
        setStatus?.('Vibeをエンコード中...');
        encoded = await window.api.encodeVibe(apiKey, v.image, model, v.informationExtracted);
        cacheRef.current.set(cacheKey, encoded);
      }
      result.push({
        image: encoded,
        informationExtracted: v.informationExtracted,
        referenceStrength: v.referenceStrength,
      });
    }
    return result;
  }

  return { encodeVibeImages };
}
