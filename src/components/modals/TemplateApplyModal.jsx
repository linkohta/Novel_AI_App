import { useState } from 'react';
import ModalOverlay from './ModalOverlay.jsx';
import {
  extractTemplateVariables,
  substituteTemplateVariables,
} from '../../utils/templateVariables.js';

function TemplateApplyFields({ template, onCancel, onConfirm }) {
  const variables = extractTemplateVariables(template.text);
  const [values, setValues] = useState(() =>
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

export default function TemplateApplyModal({ applyState, onCancel, onConfirm }) {
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
