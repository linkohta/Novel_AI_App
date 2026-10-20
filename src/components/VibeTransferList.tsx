import type { ChangeEvent, ReactNode } from 'react';
import VibeTransferCard, { type VibeTransferCardProps } from './VibeTransferCard';
import type { VibeTransferImage } from '../types/domain';
import { VIBE_SET_FILE_ACCEPT } from '../utils/vibeTransferFiles';

interface VibeTransferListProps {
  listId?: string;
  images: VibeTransferImage[];
  onChangeField: VibeTransferCardProps['onChangeField'];
  onRemove: VibeTransferCardProps['onRemove'];
  onBalance: () => void;
  onAddImage: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddSetFile: (e: ChangeEvent<HTMLInputElement>) => void;
  setFileLabel: string;
  // ポーションセットファイルのファイル選択欄の直前に出す補足説明（任意）。
  setFileHint?: ReactNode;
}

// AIポーション（Vibe Transfer）の参照画像一覧＋「参照強度をバランス調整」＋
// 参照画像／ポーションセットファイルの追加欄。単一プロンプト用
// （VibeTransferSection）と複数プロンプト連続生成の各行（QueueItemCard）で
// 同じ構成を繰り返していたため共通化した。
export default function VibeTransferList({
  listId,
  images,
  onChangeField,
  onRemove,
  onBalance,
  onAddImage,
  onAddSetFile,
  setFileLabel,
  setFileHint,
}: VibeTransferListProps) {
  return (
    <>
      <div id={listId}>
        {images.map((image) => (
          <VibeTransferCard
            key={image.id}
            image={image}
            onChangeField={onChangeField}
            onRemove={onRemove}
          />
        ))}
      </div>
      {images.length > 1 && (
        <button type="button" className="secondary" onClick={onBalance}>
          参照強度をバランス調整
        </button>
      )}
      <label>＋ 参照画像を追加</label>
      <input type="file" accept="image/*" onChange={onAddImage} />
      <label>{setFileLabel}</label>
      {setFileHint}
      <input type="file" accept={VIBE_SET_FILE_ACCEPT} onChange={onAddSetFile} />
    </>
  );
}
