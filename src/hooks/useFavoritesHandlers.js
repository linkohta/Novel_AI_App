import { useState } from 'react';

// Handlers for the "お気に入り" section: saving/editing favorite artists and
// favorite characters, and "テンプレへ" which copies a favorite character
// into the "キャラクター名で追加" form (useCharacters' charNameByName/
// charSeriesByName state) and expands that section.
export function useFavoritesHandlers({
  favoriteArtists,
  favoriteCharacters,
  setStatus,
  setCharNameByName,
  setCharSeriesByName,
  setSectionState,
  charNameByNameRef,
}) {
  const [favArtistNameInput, setFavArtistNameInput] = useState('');
  const [favArtistEditDraft, setFavArtistEditDraft] = useState(null);
  const [favCharNameInput, setFavCharNameInput] = useState('');
  const [favCharSeriesInput, setFavCharSeriesInput] = useState('');
  const [favCharEditDraft, setFavCharEditDraft] = useState(null);

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
    const name = favArtistEditDraft.name.trim();
    if (!name) {
      setStatus('アーティスト名を入力してください');
      return;
    }
    await favoriteArtists.editItem({ id: favArtistEditDraft.id, name });
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

  function handleToTemplateFavChar(favorite) {
    setCharNameByName(favorite.name);
    setCharSeriesByName(favorite.series || '');
    setSectionState((prev) => ({ ...prev, characterSection: true }));
    charNameByNameRef.current?.focus();
  }

  async function handleSaveFavCharEdit() {
    const name = favCharEditDraft.name.trim();
    const series = (favCharEditDraft.series || '').trim();
    if (!name) {
      setStatus('キャラクター名を入力してください');
      return;
    }
    await favoriteCharacters.editItem({ id: favCharEditDraft.id, name, series });
    setFavCharEditDraft(null);
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
  };
}
