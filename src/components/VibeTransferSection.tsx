import type { ChangeEvent } from 'react';
import Section from './Section';
import VibeTransferList from './VibeTransferList';
import type { VibeTransferCardProps } from './VibeTransferCard';
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
      <VibeTransferList
        listId="vibeTransferList"
        images={vibeTransferImages}
        onChangeField={onChangeImageField}
        onRemove={onRemoveImage}
        onBalance={onBalanceStrengths}
        onAddImage={onAddImage}
        onAddSetFile={onAddSetFile}
        setFileLabel="＋ ポーションセットファイルを読み込む"
        setFileHint={
          <p className="hint">
            NovelAI公式サイトで書き出した「ポーションセット」ファイル（.naiv4vibe）、および複数の
            ポーションをまとめてExportした「ポーションセットバンドル」ファイル（.naiv4vibeBundle）を
            読み込みます。
          </p>
        }
      />
    </Section>
  );
}
