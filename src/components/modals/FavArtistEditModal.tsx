import ModalOverlay from './ModalOverlay';
import ModalButtons from './ModalButtons';
import type { FavoriteArtist } from '../../types/domain';

interface FavArtistEditModalProps {
  draft: FavoriteArtist | null;
  onChange: (draft: FavoriteArtist) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function FavArtistEditModal({
  draft,
  onChange,
  onCancel,
  onSave,
}: FavArtistEditModalProps) {
  return (
    <ModalOverlay open={!!draft}>
      <h2>お気に入りアーティストを編集</h2>
      <label>アーティスト名</label>
      <input
        type="text"
        value={draft?.name || ''}
        onChange={(e) => onChange({ ...(draft as FavoriteArtist), name: e.target.value })}
      />
      <ModalButtons onCancel={onCancel} onConfirm={onSave} />
    </ModalOverlay>
  );
}
