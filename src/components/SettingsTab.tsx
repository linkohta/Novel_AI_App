import type { SubscriptionInfo } from '../types/window-api';

interface SettingsTabProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  onCheckSubscription: () => void;
  subscriptionStatus: string;
  subscriptionInfo: SubscriptionInfo | null;
  outputDir: string;
  onChooseOutputDir: () => void;
  onResetOutputDir: () => void;
}

function formatOpusPerks(info: SubscriptionInfo): string {
  return info.opusPerks
    .map(
      (p) =>
        `解像度${p.resolution}以下 ${p.maxPrompts}回まで（${Math.round(p.resetAfter / 3600)}時間ごとにリセット）`
    )
    .join(' / ');
}

// 左パネル「設定」タブの中身：APIキー・Anlas/Opus残量の確認・画像の保存先フォルダ。他のタブと同様、状態は持たずApp.tsxからpropsで受け取る。
export default function SettingsTab({
  apiKey,
  setApiKey,
  onCheckSubscription,
  subscriptionStatus,
  subscriptionInfo,
  outputDir,
  onChooseOutputDir,
  onResetOutputDir,
}: SettingsTabProps) {
  return (
    <>
      <label>NovelAI API キー (persistent token)</label>
      <input
        type="password"
        placeholder="pst-..."
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <button type="button" onClick={onCheckSubscription}>
        Anlas / Opus残量を確認
      </button>
      {subscriptionStatus && <p className="hint">{subscriptionStatus}</p>}
      {subscriptionInfo && (
        <p className="hint">
          Anlas残量: {subscriptionInfo.anlas}
          {subscriptionInfo.opusPerks.length > 0 && (
            <>
              <br />
              Opus無料生成枠: {formatOpusPerks(subscriptionInfo)}
            </>
          )}
        </p>
      )}

      <label>画像の保存先フォルダ</label>
      <div className="output-dir-row">
        <input type="text" readOnly value={outputDir || '（既定のフォルダを使用）'} />
        <button type="button" onClick={onChooseOutputDir}>
          参照...
        </button>
        {outputDir && (
          <button type="button" onClick={onResetOutputDir}>
            既定に戻す
          </button>
        )}
      </div>
    </>
  );
}
