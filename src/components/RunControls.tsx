interface RunControlsProps {
  running: boolean;
  // 実行中以外の理由で開始を無効化したい場合（複数プロンプト連続生成でリストが空など）。
  startDisabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  status: string;
  statusId: string;
}

// 連続生成・複数プロンプト連続生成で共通の「連続生成する／中断する」ボタン行と
// 進捗ステータス表示。
export default function RunControls({
  running,
  startDisabled,
  onStart,
  onStop,
  status,
  statusId,
}: RunControlsProps) {
  return (
    <>
      <div className="row">
        <div>
          <button type="button" onClick={onStart} disabled={running || startDisabled}>
            連続生成する
          </button>
        </div>
        <div>
          <button type="button" className="secondary" onClick={onStop} disabled={!running}>
            中断する
          </button>
        </div>
      </div>
      <div id={statusId} className="file-info">
        {status}
      </div>
    </>
  );
}
