import Section from './Section';
import type { FavoriteArtist, FavoriteCharacter } from '../types/domain';

interface FavoritesSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  favArtists: FavoriteArtist[];
  favArtistNameInput: string;
  setFavArtistNameInput: (value: string) => void;
  onSaveFavArtist: () => void;
  onInsertFavArtist: (favorite: FavoriteArtist) => void;
  onEditFavArtist: (favorite: FavoriteArtist) => void;
  onDeleteFavArtist: (id: string) => void;
  favChars: FavoriteCharacter[];
  favCharNameInput: string;
  setFavCharNameInput: (value: string) => void;
  favCharSeriesInput: string;
  setFavCharSeriesInput: (value: string) => void;
  onSaveFavChar: () => void;
  onInsertFavChar: (favorite: FavoriteCharacter) => void;
  onToTemplateFavChar: (favorite: FavoriteCharacter) => void;
  onEditFavChar: (favorite: FavoriteCharacter) => void;
  onDeleteFavChar: (id: string) => void;
}

export default function FavoritesSection({
  open,
  onToggle,
  favArtists,
  favArtistNameInput,
  setFavArtistNameInput,
  onSaveFavArtist,
  onInsertFavArtist,
  onEditFavArtist,
  onDeleteFavArtist,
  favChars,
  favCharNameInput,
  setFavCharNameInput,
  favCharSeriesInput,
  setFavCharSeriesInput,
  onSaveFavChar,
  onInsertFavChar,
  onToTemplateFavChar,
  onEditFavChar,
  onDeleteFavChar,
}: FavoritesSectionProps) {
  return (
    <Section id="favoritesSection" title="お気に入り" open={open} onToggle={onToggle}>
      <label>お気に入りアーティスト</label>
      <div className="chunk-row">
        <input
          type="text"
          placeholder="アーティスト名"
          value={favArtistNameInput}
          onChange={(e) => setFavArtistNameInput(e.target.value)}
        />
        <button type="button" onClick={onSaveFavArtist}>
          保存
        </button>
      </div>
      <div id="favArtistList">
        {favArtists.map((favorite) => (
          <div className="chunk-chip" key={favorite.id}>
            <span
              className="chunk-insert"
              title="クリックでフォーカス中の欄に挿入"
              onClick={() => onInsertFavArtist(favorite)}
            >
              {favorite.name}
            </span>
            <span className="chunk-edit" onClick={() => onEditFavArtist(favorite)}>
              ✎
            </span>
            <span className="chunk-delete" onClick={() => onDeleteFavArtist(favorite.id)}>
              ×
            </span>
          </div>
        ))}
      </div>

      <label>お気に入りキャラクター</label>
      <div className="row">
        <div>
          <label>キャラクター名</label>
          <input
            type="text"
            placeholder="hatsune miku"
            value={favCharNameInput}
            onChange={(e) => setFavCharNameInput(e.target.value)}
          />
        </div>
        <div>
          <label>作品名（任意）</label>
          <input
            type="text"
            placeholder="vocaloid"
            value={favCharSeriesInput}
            onChange={(e) => setFavCharSeriesInput(e.target.value)}
          />
        </div>
      </div>
      <button type="button" onClick={onSaveFavChar}>
        キャラクターを保存
      </button>
      <div id="favCharList">
        {favChars.map((favorite) => {
          const label = favorite.series ? `${favorite.name} (${favorite.series})` : favorite.name;
          return (
            <div className="chunk-chip" key={favorite.id}>
              <span
                className="chunk-insert"
                title="クリックでフォーカス中の欄に挿入"
                onClick={() => onInsertFavChar(favorite)}
              >
                {label}
              </span>
              <span
                className="chunk-to-template"
                title="「キャラクター名で追加」欄に入力する"
                onClick={() => onToTemplateFavChar(favorite)}
              >
                テンプレへ
              </span>
              <span className="chunk-edit" onClick={() => onEditFavChar(favorite)}>
                ✎
              </span>
              <span className="chunk-delete" onClick={() => onDeleteFavChar(favorite.id)}>
                ×
              </span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
