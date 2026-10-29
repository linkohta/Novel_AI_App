import type { FavoriteArtist, FavoriteCharacter, FavoriteSeries } from '../types/domain';

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

export interface FavoriteOption {
  key: string;
  label: string;
  value: string;
}

export interface FavoriteOptionGroup {
  label: string;
  options: FavoriteOption[];
}

// テンプレート変数の入力欄で選べるお気に入りの一覧（種類ごとのグループ）。
// 選んだときに入る文字列は、管理モーダルのチップで挿入する文字列と同じにする。
// お気に入りが1件も無い種類のグループは含めない。
export function buildFavoriteOptionGroups(
  artists: FavoriteArtist[],
  characters: FavoriteCharacter[],
  series: FavoriteSeries[]
): FavoriteOptionGroup[] {
  const groups: FavoriteOptionGroup[] = [
    {
      label: 'アーティスト',
      options: artists.map((f) => ({ key: f.id, label: f.name, value: favoriteArtistText(f) })),
    },
    {
      label: 'キャラクター',
      options: characters.map((f) => ({
        key: f.id,
        label: favoriteCharacterText(f),
        value: favoriteCharacterText(f),
      })),
    },
    {
      label: '作品',
      options: series.map((f) => ({ key: f.id, label: f.name, value: f.name })),
    },
  ];
  return groups.filter((group) => group.options.length > 0);
}
