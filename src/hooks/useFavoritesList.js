import { useCallback } from 'react';
import { useNamedList } from './useNamedList.js';

export function useFavoritesList(kind) {
  const load = useCallback(() => window.api.loadFavorites(kind), [kind]);
  const save = useCallback((item) => window.api.saveFavorite(kind, item), [kind]);
  const update = useCallback((item) => window.api.updateFavorite(kind, item), [kind]);
  const remove = useCallback((id) => window.api.deleteFavorite(kind, id), [kind]);
  return useNamedList({ load, save, update, remove });
}
