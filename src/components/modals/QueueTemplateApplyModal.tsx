import { useState } from 'react';
import ModalOverlay from './ModalOverlay';
import {
  extractQueueTemplateVariables,
  substituteQueueTemplateRows,
} from '../../utils/templateVariables';
import type { QueueTemplate, QueueTemplateApplyState, QueueTemplateRow } from '../../types/domain';

interface QueueTemplateApplyFieldsProps {
  template: QueueTemplate;
  onCancel: () => void;
  onConfirm: (rows: QueueTemplateRow[]) => void;
}

function QueueTemplateApplyFields({
  template,
  onCancel,
  onConfirm,
}: QueueTemplateApplyFieldsProps) {
  const variables = extractQueueTemplateVariables(template.rows);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((name) => [name, '']))
  );

  return (
    <>
      <h2>テンプレートの変数を入力</h2>
      <div id="queueTemplateApplyFields">
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
          onClick={() => onConfirm(substituteQueueTemplateRows(template.rows, values))}
        >
          反映
        </button>
      </div>
    </>
  );
}

interface QueueTemplateApplyModalProps {
  applyState: QueueTemplateApplyState | null;
  onCancel: () => void;
  onConfirm: (rows: QueueTemplateRow[]) => void;
}

export default function QueueTemplateApplyModal({
  applyState,
  onCancel,
  onConfirm,
}: QueueTemplateApplyModalProps) {
  return (
    <ModalOverlay open={!!applyState}>
      {applyState && (
        <QueueTemplateApplyFields
          key={applyState.template.id}
          template={applyState.template}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )}
    </ModalOverlay>
  );
}
