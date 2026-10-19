import ModalOverlay from './ModalOverlay';
import ModalButtons from './ModalButtons';
import type { NamedItem } from '../../types/domain';

interface NamedItemEditModalProps {
  draft: NamedItem | null;
  onChange: (draft: NamedItem) => void;
  onCancel: () => void;
  onSave: () => void;
  title: string;
  nameLabel: string;
  textLabel: string;
}

// 名前＋本文を持つ項目（プロンプトチャンク／プロンプトテンプレート）の
// 編集モーダル。両者は見出し・ラベルの文言以外は同一だったため1つにまとめた。
export default function NamedItemEditModal({
  draft,
  onChange,
  onCancel,
  onSave,
  title,
  nameLabel,
  textLabel,
}: NamedItemEditModalProps) {
  return (
    <ModalOverlay open={!!draft}>
      <h2>{title}</h2>
      <label>{nameLabel}</label>
      <input
        type="text"
        value={draft?.name || ''}
        onChange={(e) => onChange({ ...(draft as NamedItem), name: e.target.value })}
      />
      <label>{textLabel}</label>
      <textarea
        value={draft?.text || ''}
        onChange={(e) => onChange({ ...(draft as NamedItem), text: e.target.value })}
      />
      <ModalButtons onCancel={onCancel} onConfirm={onSave} />
    </ModalOverlay>
  );
}
