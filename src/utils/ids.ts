// 古い保存データ（Reactのリストキーとして使うidを持たない）を読み込んだ際に、
// 既存の要素にも安定したキーがつくようidを補完する。既にidがあればそのまま返す。
export function ensureId<T extends { id?: string }>(item: T): T & { id: string } {
  return item.id ? (item as T & { id: string }) : { ...item, id: window.crypto.randomUUID() };
}
