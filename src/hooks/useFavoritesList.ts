import { useCallback } from 'react';
import { useNamedList } from './useNamedList';
import type { FavoriteKind, GenericListItem, JsonValue } from '../types/window-api';

export function useFavoritesList(kind: FavoriteKind) {
  const load = useCallback(() => window.api.loadFavorites(kind), [kind]);
  const save = useCallback((item: JsonValue) => window.api.saveFavorite(kind, item), [kind]);
  const update = useCallback(
    (item: GenericListItem) => window.api.updateFavorite(kind, item),
    [kind]
  );
  const remove = useCallback((id: string) => window.api.deleteFavorite(kind, id), [kind]);
  return useNamedList<GenericListItem, JsonValue>({ load, save, update, remove });
}
