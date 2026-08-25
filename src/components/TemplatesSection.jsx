import Section from './Section.jsx';

export default function TemplatesSection({
  open,
  onToggle,
  templates,
  templateNameInput,
  setTemplateNameInput,
  templateTextInput,
  setTemplateTextInput,
  onSaveTemplate,
  onApplyTemplate,
  onEditTemplate,
  onDeleteTemplate,
}) {
  return (
    <Section id="templateSection" title="プロンプトテンプレート" open={open} onToggle={onToggle}>
      <label>テンプレート名</label>
      <input
        type="text"
        placeholder="テンプレート名"
        value={templateNameInput}
        onChange={(e) => setTemplateNameInput(e.target.value)}
      />
      <label>テンプレート本文（変数は (変数名) の形式で任意個数指定可能）</label>
      <textarea
        placeholder="1girl, (hair_color) hair, (pose), masterpiece"
        value={templateTextInput}
        onChange={(e) => setTemplateTextInput(e.target.value)}
      />
      <button type="button" onClick={onSaveTemplate}>
        テンプレートを保存
      </button>

      <div id="templateList">
        {templates.map((template) => (
          <div className="template-chip" key={template.id}>
            <span className="template-name" title={template.text}>
              {template.name}
            </span>
            <button
              type="button"
              className="template-apply"
              onClick={() => onApplyTemplate(template)}
            >
              適用
            </button>
            <button
              type="button"
              className="template-edit"
              onClick={() => onEditTemplate(template)}
            >
              編集
            </button>
            <button
              type="button"
              className="template-delete"
              onClick={() => onDeleteTemplate(template.id)}
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}
