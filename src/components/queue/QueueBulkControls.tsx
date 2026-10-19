import type { ChangeEvent } from 'react';
import { VIBE_SET_FILE_ACCEPT } from '../../utils/vibeTransferFiles';

interface QueueBulkControlsProps {
  bulkCount: string;
  setBulkCount: (value: string) => void;
  onApplyBulkCount: () => void;
  onApplyBulkVibeTransferImage: (e: ChangeEvent<HTMLInputElement>) => void;
  onApplyBulkVibeTransferSetFile: (e: ChangeEvent<HTMLInputElement>) => void;
}

// 複数プロンプト連続生成のリスト全行へまとめて反映する操作（生成枚数の一括
// 指定・AIポーション参照画像の一括追加）。入力値自体は永続化しない。
export default function QueueBulkControls({
  bulkCount,
  setBulkCount,
  onApplyBulkCount,
  onApplyBulkVibeTransferImage,
  onApplyBulkVibeTransferSetFile,
}: QueueBulkControlsProps) {
  return (
    <>
      <div className="row">
        <div>
          <label>生成枚数を全行にまとめて指定</label>
          <input
            type="number"
            min="1"
            max="100"
            value={bulkCount}
            onChange={(e) => setBulkCount(e.target.value)}
          />
        </div>
        <div>
          <button type="button" className="secondary" onClick={onApplyBulkCount}>
            全行に反映
          </button>
        </div>
      </div>

      <label>AIポーション（Vibe Transfer）を全行にまとめて追加</label>
      <p className="hint">
        選択した参照画像・ポーションセットファイルを、既存の行ごとの参照画像は残したまま全行に追加します。
      </p>
      <div className="row">
        <div>
          <label>＋ 参照画像を全行に追加</label>
          <input type="file" accept="image/*" onChange={onApplyBulkVibeTransferImage} />
        </div>
        <div>
          <label>＋ ポーションセットファイルを全行に追加（.naiv4vibe / .naiv4vibeBundle）</label>
          <input
            type="file"
            accept={VIBE_SET_FILE_ACCEPT}
            onChange={onApplyBulkVibeTransferSetFile}
          />
        </div>
      </div>
    </>
  );
}
