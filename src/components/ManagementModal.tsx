import ModalOverlay from './modals/ModalOverlay';
import ChunksSection from './ChunksSection';
import TemplatesSection from './TemplatesSection';
import FavoritesSection from './FavoritesSection';
import type { FavoriteArtist, FavoriteCharacter, NamedItem } from '../types/domain';

interface ManagementModalProps {
  open: boolean;
  onClose: () => void;
  chunks: NamedItem[];
  chunkNameInput: string;
  setChunkNameInput: (value: string) => void;
  onSaveChunk: () => void;
  onInsertChunk: (chunk: NamedItem) => void;
  onEditChunk: (chunk: NamedItem) => void;
  onDeleteChunk: (id: string) => void;
  templates: NamedItem[];
  templateNameInput: string;
  setTemplateNameInput: (value: string) => void;
  templateTextInput: string;
  setTemplateTextInput: (value: string) => void;
  onSaveTemplate: () => void;
  onApplyTemplate: (template: NamedItem) => void;
  onEditTemplate: (template: NamedItem) => void;
  onDeleteTemplate: (id: string) => void;
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

// プロンプトチャンク／プロンプトテンプレート／お気に入りは使用頻度が低く
// 左パネルを圧迫していたため、まとめて1つの管理用モーダルへ切り出した
// （左パネル本体はタブ切り替えのみを行い、常時表示はしない）。
export default function ManagementModal({
  open,
  onClose,
  chunks,
  chunkNameInput,
  setChunkNameInput,
  onSaveChunk,
  onInsertChunk,
  onEditChunk,
  onDeleteChunk,
  templates,
  templateNameInput,
  setTemplateNameInput,
  templateTextInput,
  setTemplateTextInput,
  onSaveTemplate,
  onApplyTemplate,
  onEditTemplate,
  onDeleteTemplate,
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
}: ManagementModalProps) {
  return (
    <ModalOverlay open={open}>
      <h2>チャンク・テンプレート・お気に入りの管理</h2>
      <ChunksSection
        chunks={chunks}
        chunkNameInput={chunkNameInput}
        setChunkNameInput={setChunkNameInput}
        onSaveChunk={onSaveChunk}
        onInsertChunk={onInsertChunk}
        onEditChunk={onEditChunk}
        onDeleteChunk={onDeleteChunk}
      />
      <TemplatesSection
        templates={templates}
        templateNameInput={templateNameInput}
        setTemplateNameInput={setTemplateNameInput}
        templateTextInput={templateTextInput}
        setTemplateTextInput={setTemplateTextInput}
        onSaveTemplate={onSaveTemplate}
        onApplyTemplate={onApplyTemplate}
        onEditTemplate={onEditTemplate}
        onDeleteTemplate={onDeleteTemplate}
      />
      <FavoritesSection
        favArtists={favArtists}
        favArtistNameInput={favArtistNameInput}
        setFavArtistNameInput={setFavArtistNameInput}
        onSaveFavArtist={onSaveFavArtist}
        onInsertFavArtist={onInsertFavArtist}
        onEditFavArtist={onEditFavArtist}
        onDeleteFavArtist={onDeleteFavArtist}
        favChars={favChars}
        favCharNameInput={favCharNameInput}
        setFavCharNameInput={setFavCharNameInput}
        favCharSeriesInput={favCharSeriesInput}
        setFavCharSeriesInput={setFavCharSeriesInput}
        onSaveFavChar={onSaveFavChar}
        onInsertFavChar={onInsertFavChar}
        onToTemplateFavChar={onToTemplateFavChar}
        onEditFavChar={onEditFavChar}
        onDeleteFavChar={onDeleteFavChar}
      />
      <div className="modal-buttons">
        <button type="button" onClick={onClose}>
          閉じる
        </button>
      </div>
    </ModalOverlay>
  );
}
