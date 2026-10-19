import TemplateChipList from './TemplateChipList';
import type { NamedItem } from '../types/domain';
import { handleMultipleFiles } from '../utils/fileInput';

interface TemplatesSectionProps {
  templates: NamedItem[];
  templateNameInput: string;
  setTemplateNameInput: (value: string) => void;
  templateTextInput: string;
  setTemplateTextInput: (value: string) => void;
  onSaveTemplate: () => void;
  onApplyTemplate: (template: NamedItem) => void;
  onEditTemplate: (template: NamedItem) => void;
  onDeleteTemplate: (id: string) => void;
  onExportTemplate: (template: NamedItem) => void;
  onImportTemplateFiles: (files: File[]) => void;
}

export default function TemplatesSection({
  templates,
  templateNameInput,
  setTemplateNameInput,
  templateTextInput,
  setTemplateTextInput,
  onSaveTemplate,
  onApplyTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onExportTemplate,
  onImportTemplateFiles,
}: TemplatesSectionProps) {
  return (
    <div className="manage-block">
      <h3>プロンプトテンプレート</h3>
      <label>テンプレート名</label>
      <input
        type="text"
        placeholder="テンプレート名"
        value={templateNameInput}
        onChange={(e) => setTemplateNameInput(e.target.value)}
      />
      <label>テンプレート本文（変数は "変数名" の形式で任意個数指定可能）</label>
      <textarea
        placeholder='1girl, "hair_color" hair, "pose", masterpiece'
        value={templateTextInput}
        onChange={(e) => setTemplateTextInput(e.target.value)}
      />
      <button type="button" onClick={onSaveTemplate}>
        テンプレートを保存
      </button>

      <label>txtファイルからインポート（同名のテンプレートは上書きされます）</label>
      <input
        type="file"
        accept=".txt,text/plain"
        multiple
        onChange={(e) => handleMultipleFiles(e, onImportTemplateFiles)}
      />

      <TemplateChipList
        listId="templateList"
        templates={templates}
        titleOf={(template) => template.text}
        onApply={onApplyTemplate}
        onEdit={onEditTemplate}
        onExport={onExportTemplate}
        onDelete={onDeleteTemplate}
      />
    </div>
  );
}
