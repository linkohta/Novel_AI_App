import { extractNovelAiMetadata } from '../utils/pngMetadata.js';

// 「設定」セクションおよび「複数プロンプト連続生成」の各行にある、NovelAI
// 生成PNGからのプロンプト読み込みハンドラ。抽出したプロンプト・ネガティブ
// プロンプトは実際の生成で送信された値であり、自動追加されたQuality Tags
// が含まれている場合はすでにそれを含んでいるため、いずれのハンドラも
// 読み込み後にQuality Tagsの自動追加トグルをOFFにする。
export function useImageMetadataLoader({
  setPrompt,
  setNegativePrompt,
  setSteps,
  setScale,
  setSampler,
  setSeed,
  setWidth,
  setHeight,
  setQualityToggle,
  setCharacters,
  setQueueItems,
  setStatus,
}) {
  async function handleLoadImageMetadata(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 次回も同じファイルを選択できるようにする
    if (!file) return;
    try {
      const meta = await extractNovelAiMetadata(file);
      if (!meta) {
        setStatus('この画像からNovelAIの生成情報を読み取れませんでした');
        return;
      }
      setPrompt(meta.prompt);
      setNegativePrompt(meta.negativePrompt);
      if (meta.steps) setSteps(meta.steps);
      if (meta.scale) setScale(meta.scale);
      if (meta.sampler) setSampler(meta.sampler);
      if (meta.seed) setSeed(meta.seed);
      if (meta.width) setWidth(meta.width);
      if (meta.height) setHeight(meta.height);
      setQualityToggle(false);
      if (meta.characters.length > 0) {
        setCharacters(
          meta.characters.map((c) => ({
            id: window.crypto.randomUUID(),
            prompt: c.prompt,
            negativePrompt: c.negativePrompt,
            enabled: true,
          }))
        );
      }
      setStatus(
        meta.sourceInfo
          ? `画像からプロンプト情報を読み込みました（元モデル情報: ${meta.sourceInfo}。モデルの種類はこの情報からは正確に判別できないため、必要に応じて「モデル」セクションで選び直してください）`
          : '画像からプロンプト情報を読み込みました'
      );
    } catch (err) {
      setStatus(`画像の読み込みに失敗しました: ${err.message}`);
    }
  }

  async function handleLoadQueueItemImageMetadata(index, e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 次回も同じファイルを選択できるようにする
    if (!file) return;
    try {
      const meta = await extractNovelAiMetadata(file);
      if (!meta) {
        setStatus('この画像からNovelAIの生成情報を読み取れませんでした');
        return;
      }
      setQueueItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                prompt: meta.prompt,
                negativePrompt: meta.negativePrompt,
                characters: meta.characters.map((c) => ({
                  id: window.crypto.randomUUID(),
                  prompt: c.prompt,
                  negativePrompt: c.negativePrompt,
                  enabled: true,
                })),
              }
            : item
        )
      );
      // モデル・サイズ・Quality Tagsの自動追加設定は行ごとではなく共通設定
      // （左パネルの「モデル」セクション）を使うため、単一プロンプト用の読み
      // 込みと同様にここでもQuality Tagsの自動追加をOFFにしておく。
      setQualityToggle(false);
      setStatus(
        meta.sourceInfo
          ? `${index + 1}行目に画像からプロンプト情報を読み込みました（元モデル情報: ${meta.sourceInfo}。モデルの種類はこの情報からは正確に判別できないため、必要に応じて「モデル」セクションで選び直してください）`
          : `${index + 1}行目に画像からプロンプト情報を読み込みました`
      );
    } catch (err) {
      setStatus(`画像の読み込みに失敗しました: ${err.message}`);
    }
  }

  return { handleLoadImageMetadata, handleLoadQueueItemImageMetadata };
}
