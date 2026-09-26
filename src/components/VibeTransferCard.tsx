import type { VibeTransferImage } from '../types/domain';

export type VibeTransferField = 'informationExtracted' | 'referenceStrength';

export interface VibeTransferCardProps {
  image: VibeTransferImage;
  onChangeField: (id: string, field: VibeTransferField, value: number) => void;
  onRemove: (id: string) => void;
}

// AIポーション（Vibe Transfer）の参照画像1枚分のカード。単一プロンプト用
// （VibeTransferSection）と複数プロンプト連続生成の各行（PromptQueueSection）で共用する。
// ポーションセット由来（source: 'vibeFile'）はサムネイルの代わりにプレース
// ホルダーを表示し、Information Extractedは再エンコードなしに変更できないため編集不可にする。
export default function VibeTransferCard({
  image,
  onChangeField,
  onRemove,
}: VibeTransferCardProps) {
  const isVibeFile = image.source === 'vibeFile';
  return (
    <div className="char-card">
      <button type="button" className="remove-char" onClick={() => onRemove(image.id)}>
        削除
      </button>
      {isVibeFile ? (
        <div className="vibe-thumb vibe-thumb-placeholder">ポーションセット</div>
      ) : (
        <img className="vibe-thumb" src={`data:image/png;base64,${image.image}`} alt="参照画像" />
      )}
      <label>Information Extracted（{image.informationExtracted.toFixed(2)}）</label>
      {isVibeFile ? (
        <p className="hint">ポーションセットファイルに含まれる値のため変更できません。</p>
      ) : (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={image.informationExtracted}
          onChange={(e) => onChangeField(image.id, 'informationExtracted', Number(e.target.value))}
        />
      )}
      <label>Reference Strength（{image.referenceStrength.toFixed(2)}）</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={image.referenceStrength}
        onChange={(e) => onChangeField(image.id, 'referenceStrength', Number(e.target.value))}
      />
    </div>
  );
}
