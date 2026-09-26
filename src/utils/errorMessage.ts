// catchした値からユーザー向けに表示するエラーメッセージを取り出す。
// Error以外（文字列等）がthrowされた場合も文字列化して扱う。
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
