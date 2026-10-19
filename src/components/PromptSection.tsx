import type { ChangeEvent } from 'react';
import Section from './Section';

interface PromptSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  onFocusField: (key: string) => void;
  onLoadImageMetadata: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function PromptSection({
  open,
  onToggle,
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  onFocusField,
  onLoadImageMetadata,
}: PromptSectionProps) {
  return (
    <Section id="promptSection" title="プロンプト" open={open} onToggle={onToggle}>
      <label>プロンプト</label>
      <textarea
        placeholder="1girl, silver hair, ..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onFocus={() => onFocusField('prompt')}
      />

      <label>ネガティブプロンプト</label>
      <textarea
        placeholder="lowres, bad anatomy, ..."
        value={negativePrompt}
        onChange={(e) => setNegativePrompt(e.target.value)}
        onFocus={() => onFocusField('negativePrompt')}
      />

      {/* 読み込んだ内容が反映される先（プロンプト欄）のすぐ近くに置く。 */}
      <label>画像からプロンプトを読み込む</label>
      <p className="hint">
        NovelAIで生成されたPNG画像を選択すると、埋め込まれた生成情報（プロンプト・ネガティブプロンプト・サイズ・ステップ数・スケール・サンプラー・シード・キャラクタープロンプト）を読み取って自動入力します。
      </p>
      <input type="file" accept="image/png" onChange={onLoadImageMetadata} />
    </Section>
  );
}
