// 画面の数値入力欄（文字列）を生成処理で使う整数へ変換する共通処理。

// 生成回数・枚数を1〜100の整数に丸める（未入力・不正値は1）。
export function clampCount(value: number | string): number {
  return Math.max(1, Math.min(100, parseInt(String(value), 10) || 1));
}

// 生成間隔（秒）を1以上の整数にする（未入力・不正値は既定の5秒）。
export function parseIntervalSec(value: string): number {
  return Math.max(1, parseInt(value, 10) || 5);
}
