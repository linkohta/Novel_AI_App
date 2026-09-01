export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// `totalSeconds` をカウントダウンし、`shouldStop()` がtrueになるか時間切れになる
// まで、おおよそ1秒ごとに `onTick(remainingSeconds)` を呼び出す。単純に
// `sleep(1000)` をループしながらカウンタをデクリメントする方式とは異なり、
// これは毎回のtickで残り時間をウォールクロックのタイムスタンプから再計算する
// ため、1回の `sleep` 呼び出しが長引いた場合（例えばウィンドウが最小化・
// バックグラウンド化した際のOS/ブラウザによるタイマーの間引き）でも、
// 想定より待機時間全体が延びてしまうことがなく——カウントダウンはずれて
// いくのではなく本来の終了時刻に追いつく形になる。
export async function waitWithCountdown(
  totalSeconds: number,
  { onTick, shouldStop }: { onTick: (remainingSeconds: number) => void; shouldStop: () => boolean }
): Promise<void> {
  const endTime = Date.now() + totalSeconds * 1000;
  while (!shouldStop()) {
    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) return;
    onTick(Math.ceil(remainingMs / 1000));
    await sleep(Math.min(1000, remainingMs));
  }
}
