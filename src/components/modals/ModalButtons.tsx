interface ModalButtonsProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

// 編集・適用系モーダル共通の「キャンセル／保存（反映）」ボタン行。
// `.modal-buttons` は `.modal` 直下に置くことでスクロール時も下端に固定される
// （CLAUDE.md「src/components/modals」の節を参照）ため、このコンポーネントは
// 各モーダルの末尾に直接置くこと。
export default function ModalButtons({
  onCancel,
  onConfirm,
  confirmLabel = '保存',
}: ModalButtonsProps) {
  return (
    <div className="modal-buttons">
      <button type="button" className="secondary" onClick={onCancel}>
        キャンセル
      </button>
      <button type="button" onClick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  );
}
