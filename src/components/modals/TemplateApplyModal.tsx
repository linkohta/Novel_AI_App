import { useState } from 'react';
import ModalOverlay from './ModalOverlay';
import {
  extractTemplateVariables,
  substituteTemplateVariables,
} from '../../utils/templateVariables';
import type { NamedItem, TemplateApplyState } from '../../types/domain';

interface TemplateApplyFieldsProps {
  template: NamedItem;
  onCancel: () => void;
  onConfirm: (result: string) => void;
}

function TemplateApplyFields({ template, onCancel, onConfirm }: TemplateApplyFieldsProps) {
  const variables = extractTemplateVariables(template.text);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((name) => [name, '']))
  );

  return (
    <>
      <h2>テンプレートの変数を入力</h2>
      <div id="templateApplyFields">
        {variables.length === 0 ? (
          <div className="no-vars">このテンプレートに変数はありません。そのまま反映します。</div>
        ) : (
          variables.map((name) => (
            <div className="template-var-field" key={name}>
              <label>{name}</label>
              <input
                type="text"
                value={values[name] || ''}
                onChange={(e) => setValues({ ...values, [name]: e.target.value })}
              />
            </div>
          ))
        )}
      </div>
      <div className="modal-buttons">
        <button type="button" className="secondary" onClick={onCancel}>
          キャンセル
        </button>
        <button
          type="button"
          onClick={() => onConfirm(substituteTemplateVariables(template.text, values))}
        >
          反映
        </button>
      </div>
    </>
  );
}

interface TemplateApplyModalProps {
  applyState: TemplateApplyState | null;
  onCancel: () => void;
  onConfirm: (result: string) => void;
}

export default function TemplateApplyModal({
  applyState,
  onCancel,
  onConfirm,
}: TemplateApplyModalProps) {
  return (
    <ModalOverlay open={!!applyState}>
      {applyState && (
        <TemplateApplyFields
          key={applyState.template.id}
          template={applyState.template}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )}
    </ModalOverlay>
  );
}
