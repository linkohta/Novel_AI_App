interface TemplateChipListProps<T extends { id: string; name: string }> {
  listId: string;
  templates: T[];
  // チップにマウスを乗せたときのツールチップ（プロンプトテンプレートでは本文）。
  titleOf?: (template: T) => string;
  // 連続生成中など、「適用」だけを無効化したい場合に指定する。
  applyDisabled?: boolean;
  onApply: (template: T) => void;
  onEdit: (template: T) => void;
  onExport: (template: T) => void;
  onDelete: (id: string) => void;
}

// プロンプトテンプレート（管理モーダル）と複数プロンプトテンプレート
// （「複数プロンプト連続生成」セクション）で共通の、「適用／編集／
// エクスポート／削除」ボタン付きのテンプレート一覧チップ。
export default function TemplateChipList<T extends { id: string; name: string }>({
  listId,
  templates,
  titleOf,
  applyDisabled,
  onApply,
  onEdit,
  onExport,
  onDelete,
}: TemplateChipListProps<T>) {
  return (
    <div id={listId}>
      {templates.map((template) => (
        <div className="template-chip" key={template.id}>
          <span className="template-name" title={titleOf?.(template)}>
            {template.name}
          </span>
          <button
            type="button"
            className="template-apply"
            onClick={() => onApply(template)}
            disabled={applyDisabled}
          >
            適用
          </button>
          <button type="button" className="template-edit" onClick={() => onEdit(template)}>
            編集
          </button>
          <button type="button" className="template-export" onClick={() => onExport(template)}>
            エクスポート
          </button>
          <button type="button" className="template-delete" onClick={() => onDelete(template.id)}>
            削除
          </button>
        </div>
      ))}
    </div>
  );
}
