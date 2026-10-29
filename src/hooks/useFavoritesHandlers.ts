import { Dispatch, MutableRefObject, SetStateAction, useState } from 'react';
import type {
  FavoriteArtist,
  FavoriteCharacter,
  FavoriteSeries,
  NamedListApi,
  SectionState,
} from '../types/domain';

interface UseFavoritesHandlersParams {
  favoriteArtists: NamedListApi<FavoriteArtist, { name: string }>;
  favoriteCharacters: NamedListApi<FavoriteCharacter, { name: string; series: string }>;
  favoriteSeries: NamedListApi<FavoriteSeries, { name: string }>;
  setStatus: (status: string) => void;
  setCharNameByName: Dispatch<SetStateAction<string>>;
  setCharSeriesByName: Dispatch<SetStateAction<string>>;
  setSectionState: Dispatch<SetStateAction<SectionState>>;
  charNameByNameRef: MutableRefObject<HTMLInputElement | null>;
  onNavigateToCharacters?: () => void;
}

// 「お気に入り」セクションのハンドラ：お気に入りアーティスト・お気に入り
// キャラクター・お気に入り作品の保存／編集、および「テンプレへ」（お気に入りキャラクターを
// 「キャラクター名で追加」フォーム（useCharactersのcharNameByName/
// charSeriesByNameのstate）にコピーし、そのセクションを展開する）。
export function useFavoritesHandlers({
  favoriteArtists,
  favoriteCharacters,
  favoriteSeries,
  setStatus,
  setCharNameByName,
  setCharSeriesByName,
  setSectionState,
  charNameByNameRef,
  onNavigateToCharacters,
}: UseFavoritesHandlersParams) {
  const [favArtistNameInput, setFavArtistNameInput] = useState('');
  const [favArtistEditDraft, setFavArtistEditDraft] = useState<FavoriteArtist | null>(null);
  const [favCharNameInput, setFavCharNameInput] = useState('');
  const [favCharSeriesInput, setFavCharSeriesInput] = useState('');
  const [favCharEditDraft, setFavCharEditDraft] = useState<FavoriteCharacter | null>(null);
  const [favSeriesNameInput, setFavSeriesNameInput] = useState('');
  const [favSeriesEditDraft, setFavSeriesEditDraft] = useState<FavoriteSeries | null>(null);

  async function handleSaveFavArtist() {
    const name = favArtistNameInput.trim();
    if (!name) {
      setStatus('アーティスト名を入力してください');
      return;
    }
    await favoriteArtists.addItem({ name });
    setFavArtistNameInput('');
  }

  async function handleSaveFavArtistEdit() {
    if (!favArtistEditDraft) return;
    const name = favArtistEditDraft.name.trim();
    if (!name) {
      setStatus('アーティスト名を入力してください');
      return;
    }
    await favoriteArtists.editItem({ ...favArtistEditDraft, id: favArtistEditDraft.id, name });
    setFavArtistEditDraft(null);
  }

  async function handleSaveFavChar() {
    const name = favCharNameInput.trim();
    const series = favCharSeriesInput.trim();
    if (!name) {
      setStatus('キャラクター名を入力してください');
      return;
    }
    await favoriteCharacters.addItem({ name, series });
    setFavCharNameInput('');
    setFavCharSeriesInput('');
  }

  function handleToTemplateFavChar(favorite: FavoriteCharacter) {
    setCharNameByName(favorite.name);
    setCharSeriesByName(favorite.series || '');
    setSectionState((prev) => ({ ...prev, characterSection: true }));
    onNavigateToCharacters?.();
    charNameByNameRef.current?.focus();
  }

  async function handleSaveFavCharEdit() {
    if (!favCharEditDraft) return;
    const name = favCharEditDraft.name.trim();
    const series = (favCharEditDraft.series || '').trim();
    if (!name) {
      setStatus('キャラクター名を入力してください');
      return;
    }
    await favoriteCharacters.editItem({
      ...favCharEditDraft,
      id: favCharEditDraft.id,
      name,
      series,
    });
    setFavCharEditDraft(null);
  }

  async function handleSaveFavSeries() {
    const name = favSeriesNameInput.trim();
    if (!name) {
      setStatus('作品名を入力してください');
      return;
    }
    await favoriteSeries.addItem({ name });
    setFavSeriesNameInput('');
  }

  async function handleSaveFavSeriesEdit() {
    if (!favSeriesEditDraft) return;
    const name = favSeriesEditDraft.name.trim();
    if (!name) {
      setStatus('作品名を入力してください');
      return;
    }
    await favoriteSeries.editItem({ ...favSeriesEditDraft, id: favSeriesEditDraft.id, name });
    setFavSeriesEditDraft(null);
  }

  return {
    favArtistNameInput,
    setFavArtistNameInput,
    handleSaveFavArtist,
    favArtistEditDraft,
    setFavArtistEditDraft,
    handleSaveFavArtistEdit,
    favCharNameInput,
    setFavCharNameInput,
    favCharSeriesInput,
    setFavCharSeriesInput,
    handleSaveFavChar,
    handleToTemplateFavChar,
    favCharEditDraft,
    setFavCharEditDraft,
    handleSaveFavCharEdit,
    favSeriesNameInput,
    setFavSeriesNameInput,
    handleSaveFavSeries,
    favSeriesEditDraft,
    setFavSeriesEditDraft,
    handleSaveFavSeriesEdit,
  };
}

// フックの戻り値の型。タブコンポーネント等へまとめて渡すために公開する。
export type UseFavoritesHandlersResult = ReturnType<typeof useFavoritesHandlers>;
