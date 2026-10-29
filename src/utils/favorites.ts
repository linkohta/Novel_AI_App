import type { FavoriteArtist, FavoriteCharacter } from '../types/domain';

// お気に入りをプロンプト欄へ挿入するときの文字列。アーティストはNovelAIで
// アーティストタグとして効くよう「artist:」を付ける。
export function favoriteArtistText(favorite: FavoriteArtist): string {
  return `artist:${favorite.name}`;
}

// キャラクターはDanbooru/NovelAIで一般的なキャラクタータグの表記
// 「character (series)」に合わせる（作品名が無ければキャラクター名のみ）。
export function favoriteCharacterText(favorite: FavoriteCharacter): string {
  return favorite.series ? `${favorite.name} (${favorite.series})` : favorite.name;
}
