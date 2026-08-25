import { useCallback, useEffect, useState } from 'react';

// Shared load/save/update/delete list behavior used by prompt chunks, prompt
// templates, and (via useFavoritesList) favorite artists/characters. Mirrors
// the old renderChunks/renderTemplates pattern: every mutation re-fetches the
// authoritative list from window.api rather than trusting optimistic local state.
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
