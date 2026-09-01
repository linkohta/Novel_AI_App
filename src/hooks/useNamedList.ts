import { useCallback, useEffect, useState } from 'react';

interface UseNamedListParams<TItem, TNewItem> {
  load: () => Promise<TItem[]>;
  save: (item: TNewItem) => Promise<TItem[]>;
  update: (item: TItem) => Promise<TItem[]>;
  remove: (id: string) => Promise<TItem[]>;
}

// プロンプトチャンク、プロンプトテンプレート、および（useFavoritesList経由で）
// お気に入りアーティスト／キャラクターで共有されるload/save/update/deleteの
// リスト処理。旧renderChunks/renderTemplatesのパターンを踏襲しており、
// 変更のたびに楽観的なローカルstateを信用せず、window.apiから正となる
// リストを再取得する。
export function useNamedList<TItem, TNewItem = TItem>({
  load,
  save,
  update,
  remove,
}: UseNamedListParams<TItem, TNewItem>) {
  const [items, setItems] = useState<TItem[]>([]);

  const refresh = useCallback(async () => {
    setItems(await load());
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (item: TNewItem) => {
      setItems(await save(item));
    },
    [save]
  );

  const editItem = useCallback(
    async (item: TItem) => {
      setItems(await update(item));
    },
    [update]
  );

  const removeItem = useCallback(
    async (id: string) => {
      setItems(await remove(id));
    },
    [remove]
  );

  return { items, addItem, editItem, removeItem, refresh };
}
