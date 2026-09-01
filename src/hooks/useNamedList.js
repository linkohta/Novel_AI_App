import { useCallback, useEffect, useState } from 'react';

// プロンプトチャンク、プロンプトテンプレート、および（useFavoritesList経由で）
// お気に入りアーティスト／キャラクターで共有されるload/save/update/deleteの
// リスト処理。旧renderChunks/renderTemplatesのパターンを踏襲しており、
// 変更のたびに楽観的なローカルstateを信用せず、window.apiから正となる
// リストを再取得する。
export function useNamedList({ load, save, update, remove }) {
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    setItems(await load());
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (item) => {
      setItems(await save(item));
    },
    [save]
  );

  const editItem = useCallback(
    async (item) => {
      setItems(await update(item));
    },
    [update]
  );

  const removeItem = useCallback(
    async (id) => {
      setItems(await remove(id));
    },
    [remove]
  );

  return { items, addItem, editItem, removeItem, refresh };
}
