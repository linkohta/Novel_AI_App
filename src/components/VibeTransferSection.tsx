import type { ChangeEvent } from 'react';
import Section from './Section';
import VibeTransferCard, { type VibeTransferCardProps } from './VibeTransferCard';
import type { VibeTransferImage } from '../types/domain';

interface VibeTransferSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  vibeTransferImages: VibeTransferImage[];
  onAddImage: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddSetFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
  onChangeImageField: VibeTransferCardProps['onChangeField'];
  onBalanceStrengths: () => void;
}

export default function VibeTransferSection({
  open,
  onToggle,
  vibeTransferImages,
  onAddImage,
  onAddSetFile,
  onRemoveImage,
  onChangeImageField,
  onBalanceStrengths,
}: VibeTransferSectionProps) {
  return (
    <Section id="vibeSection" title="AIポーション（Vibe Transfer）" open={open} onToggle={onToggle}>
      <p className="hint">
        参照画像をアップロードすると、その画像の画風・雰囲気を生成結果に反映します（NovelAI公式のVibe
        Transfer機能）。Information Extractedは参照画像からどれだけ情報を抽出するか、Reference
        Strengthはその情報をどれだけ強く反映するかを表します。
      </p>
      <div id="vibeTransferList">
        {vibeTransferImages.map((image) => (
          <VibeTransferCard
            key={image.id}
            image={image}
            onChangeField={onChangeImageField}
            onRemove={onRemoveImage}
          />
        ))}
      </div>
      {vibeTransferImages.length > 1 && (
        <button type="button" className="secondary" onClick={onBalanceStrengths}>
          参照強度をバランス調整
        </button>
      )}
      <label>＋ 参照画像を追加</label>
      <input type="file" accept="image/*" onChange={onAddImage} />
      <label>＋ ポーションセットファイルを読み込む</label>
      <p className="hint">
        NovelAI公式サイトで書き出した「ポーションセット」ファイル（.naiv4vibe）、および複数の
        ポーションをまとめてExportした「ポーションセットバンドル」ファイル（.naiv4vibeBundle）を
        読み込みます。
      </p>
      <input
        type="file"
        accept=".naiv4vibe,.naiv4vibebundle,.naiv4vibeBundle"
        onChange={onAddSetFile}
      />
    </Section>
  );
}
