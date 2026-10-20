import TemplateChipList from '../TemplateChipList';
import type { QueueTemplate } from '../../types/domain';
import { handleMultipleFiles } from '../../utils/fileInput';

interface QueueTemplatePanelProps {
  queueTemplates: QueueTemplate[];
  queueRunning: boolean;
  onSaveAsQueueTemplate: () => void;
  onApplyQueueTemplate: (template: QueueTemplate) => void;
  onEditQueueTemplate: (template: QueueTemplate) => void;
  onDeleteQueueTemplate: (id: string) => void;
  onExportQueueTemplate: (template: QueueTemplate) => void;
  onImportQueueTemplateFiles: (files: File[]) => void;
}

// 「複数プロンプト連続生成」セクション内の複数プロンプトテンプレート欄
// （現在の内容の保存・txtインポート・一覧）。
export default function QueueTemplatePanel({
  queueTemplates,
  queueRunning,
  onSaveAsQueueTemplate,
  onApplyQueueTemplate,
  onEditQueueTemplate,
  onDeleteQueueTemplate,
  onExportQueueTemplate,
  onImportQueueTemplateFiles,
}: QueueTemplatePanelProps) {
  return (
    <>
      <label>複数プロンプトテンプレート</label>
      <button
        type="button"
        className="secondary"
        onClick={onSaveAsQueueTemplate}
        disabled={queueRunning}
      >
        現在の内容をテンプレートとして保存
      </button>

      <label>txtファイルからインポート（同名のテンプレートは上書きされます）</label>
      <input
        type="file"
        accept=".txt,text/plain"
        multiple
        onChange={(e) => handleMultipleFiles(e, onImportQueueTemplateFiles)}
      />

      <TemplateChipList
        listId="queueTemplateList"
        templates={queueTemplates}
        applyDisabled={queueRunning}
        onApply={onApplyQueueTemplate}
        onEdit={onEditQueueTemplate}
        onExport={onExportQueueTemplate}
        onDelete={onDeleteQueueTemplate}
      />
    </>
  );
}
