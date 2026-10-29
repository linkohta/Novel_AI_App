import type { FavoriteArtist, FavoriteCharacter, FavoriteSeries } from '../types/domain';
import { favoriteCharacterText } from '../utils/favorites';

interface FavoritesSectionProps {
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
  favSeries: FavoriteSeries[];
  favSeriesNameInput: string;
  setFavSeriesNameInput: (value: string) => void;
  onSaveFavSeries: () => void;
  onInsertFavSeries: (favorite: FavoriteSeries) => void;
  onEditFavSeries: (favorite: FavoriteSeries) => void;
  onDeleteFavSeries: (id: string) => void;
}

interface NameFavoriteListProps<T extends { id: string; name: string }> {
  label: string;
  placeholder: string;
  listId: string;
  items: T[];
  nameInput: string;
  setNameInput: (value: string) => void;
  onSave: () => void;
  onInsert: (favorite: T) => void;
  onEdit: (favorite: T) => void;
  onDelete: (id: string) => void;
}

// 名前1項目だけを持つお気に入り（アーティスト・作品）の入力欄＋チップ一覧。
function NameFavoriteList<T extends { id: string; name: string }>({
  label,
  placeholder,
  listId,
  items,
  nameInput,
  setNameInput,
  onSave,
  onInsert,
  onEdit,
  onDelete,
}: NameFavoriteListProps<T>) {
  return (
    <>
      <label>{label}</label>
      <div className="chunk-row">
        <input
          type="text"
          placeholder={placeholder}
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
        <button type="button" onClick={onSave}>
          保存
        </button>
      </div>
      <div id={listId}>
        {items.map((favorite) => (
          <div className="chunk-chip" key={favorite.id}>
            <span
              className="chunk-insert"
              title="クリックでフォーカス中の欄に挿入"
              onClick={() => onInsert(favorite)}
            >
              {favorite.name}
            </span>
            <span className="chunk-edit" onClick={() => onEdit(favorite)}>
              ✎
            </span>
            <span className="chunk-delete" onClick={() => onDelete(favorite.id)}>
              ×
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function FavoritesSection({
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
  favSeries,
  favSeriesNameInput,
  setFavSeriesNameInput,
  onSaveFavSeries,
  onInsertFavSeries,
  onEditFavSeries,
  onDeleteFavSeries,
}: FavoritesSectionProps) {
  return (
    <div className="manage-block">
      <h3>お気に入り</h3>
      <NameFavoriteList
        label="お気に入りアーティスト"
        placeholder="アーティスト名"
        listId="favArtistList"
        items={favArtists}
        nameInput={favArtistNameInput}
        setNameInput={setFavArtistNameInput}
        onSave={onSaveFavArtist}
        onInsert={onInsertFavArtist}
        onEdit={onEditFavArtist}
        onDelete={onDeleteFavArtist}
      />

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
        {favChars.map((favorite) => (
          <div className="chunk-chip" key={favorite.id}>
            <span
              className="chunk-insert"
              title="クリックでフォーカス中の欄に挿入"
              onClick={() => onInsertFavChar(favorite)}
            >
              {favoriteCharacterText(favorite)}
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
        ))}
      </div>

      <NameFavoriteList
        label="お気に入り作品"
        placeholder="作品名"
        listId="favSeriesList"
        items={favSeries}
        nameInput={favSeriesNameInput}
        setNameInput={setFavSeriesNameInput}
        onSave={onSaveFavSeries}
        onInsert={onInsertFavSeries}
        onEdit={onEditFavSeries}
        onDelete={onDeleteFavSeries}
      />
    </div>
  );
}
