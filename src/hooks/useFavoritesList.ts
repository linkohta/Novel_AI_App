import { useCallback } from 'react';
import { useNamedList } from './useNamedList';
import type { FavoriteKind, GenericListItem, JsonValue } from '../types/window-api';

// 呼び出し側（FavoriteArtist/FavoriteCharacter）が期待する具体的な形は
// window.api.loadFavorites等（GenericListItem、項目形式が可変）よりも
// 狭いため、呼び出し側でジェネリック引数として指定してもらう。
export function useFavoritesList<TItem extends GenericListItem = GenericListItem>(
  kind: FavoriteKind
) {
  const load = useCallback(() => window.api.loadFavorites(kind), [kind]);
  const save = useCallback((item: JsonValue) => window.api.saveFavorite(kind, item), [kind]);
  const update = useCallback(
    (item: GenericListItem) => window.api.updateFavorite(kind, item),
    [kind]
  );
  const remove = useCallback((id: string) => window.api.deleteFavorite(kind, id), [kind]);

  return useNamedList<TItem, JsonValue>({ load, save, update, remove } as any);
}
