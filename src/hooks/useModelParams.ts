import { useState } from 'react';

// 「モデル」タブの入力値（モデル・画像サイズ・ステップ数・スケール・サンプラー・
// シード・Quality Tags自動追加・Variety+）。App.tsxに並んでいた単純なuseStateの
// 塊をまとめたもので、ModelSectionへはそのまま展開して渡す。
// シード以外はuseSettingsPersistenceで永続化される（シードは旧アプリと同様、
// 起動のたびに0/ランダムへ戻す設計のため意図的に永続化しない）。
export function useModelParams() {
  const [model, setModel] = useState('nai-diffusion-5-full');
  const [width, setWidth] = useState('1216');
  const [height, setHeight] = useState('832');
  const [steps, setSteps] = useState('28');
  const [scale, setScale] = useState('5');
  const [sampler, setSampler] = useState('k_euler_ancestral');
  const [seed, setSeed] = useState('0');
  const [qualityToggle, setQualityToggle] = useState(true);
  const [varietyPlus, setVarietyPlus] = useState(false);

  return {
    model,
    setModel,
    width,
    setWidth,
    height,
    setHeight,
    steps,
    setSteps,
    scale,
    setScale,
    sampler,
    setSampler,
    seed,
    setSeed,
    qualityToggle,
    setQualityToggle,
    varietyPlus,
    setVarietyPlus,
  };
}

export type ModelParams = ReturnType<typeof useModelParams>;
