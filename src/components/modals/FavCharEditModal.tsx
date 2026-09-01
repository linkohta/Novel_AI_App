import ModalOverlay from './ModalOverlay';
import type { FavoriteCharacter } from '../../types/domain';

interface FavCharEditModalProps {
  draft: FavoriteCharacter | null;
  onChange: (draft: FavoriteCharacter) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function FavCharEditModal({
  draft,
  onChange,
  onCancel,
  onSave,
}: FavCharEditModalProps) {
  return (
    <ModalOverlay open={!!draft}>
      <h2>お気に入りキャラクターを編集</h2>
      <label>キャラクター名</label>
      <input
        type="text"
        value={draft?.name || ''}
        onChange={(e) => onChange({ ...(draft as FavoriteCharacter), name: e.target.value })}
      />
      <label>作品名（任意）</label>
      <input
        type="text"
        value={draft?.series || ''}
        onChange={(e) => onChange({ ...(draft as FavoriteCharacter), series: e.target.value })}
      />
      <div className="modal-buttons">
        <button type="button" className="secondary" onClick={onCancel}>
          キャンセル
        </button>
        <button type="button" onClick={onSave}>
          保存
        </button>
      </div>
    </ModalOverlay>
  );
}
