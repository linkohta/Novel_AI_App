import ModalOverlay from './ModalOverlay';
import ModalButtons from './ModalButtons';

interface FavNameEditModalProps<T extends { name: string }> {
  draft: T | null;
  onChange: (draft: T) => void;
  onCancel: () => void;
  onSave: () => void;
  title: string;
  label: string;
}

// 名前1項目だけを持つお気に入り（アーティスト等）の編集モーダル。
// 見出し・ラベル文言だけをpropsで変えて共用する。
export default function FavNameEditModal<T extends { name: string }>({
  draft,
  onChange,
  onCancel,
  onSave,
  title,
  label,
}: FavNameEditModalProps<T>) {
  return (
    <ModalOverlay open={!!draft}>
      <h2>{title}</h2>
      <label>{label}</label>
      <input
        type="text"
        value={draft?.name || ''}
        onChange={(e) => onChange({ ...(draft as T), name: e.target.value })}
      />
      <ModalButtons onCancel={onCancel} onConfirm={onSave} />
    </ModalOverlay>
  );
}
