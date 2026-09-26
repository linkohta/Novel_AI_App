import type { ChangeEvent } from 'react';

// <input type="file"> のonChangeから選択された先頭のファイルを取り出して
// handlerへ渡し、同じファイルを続けて選び直せるよう選択状態をリセットする。
export function handleSingleFile(
  e: ChangeEvent<HTMLInputElement>,
  handler: (file: File) => void
): void {
  const file = e.target.files?.[0];
  if (file) handler(file);
  e.target.value = '';
}

// 複数選択（multiple）の<input type="file">用。選択された全ファイルを配列で渡す。
export function handleMultipleFiles(
  e: ChangeEvent<HTMLInputElement>,
  handler: (files: File[]) => void
): void {
  // valueのリセットでFileListが空になるため、先に配列へコピーしておく。
  const files = Array.from(e.target.files || []);
  e.target.value = '';
  handler(files);
}
