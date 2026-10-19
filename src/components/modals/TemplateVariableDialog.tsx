import { useState } from 'react';
import ModalButtons from './ModalButtons';

interface TemplateVariableDialogProps {
  // テンプレート本文から検出した変数名の一覧（重複なし）。
  variables: string[];
  fieldsId: string;
  onCancel: () => void;
  onConfirm: (values: Record<string, string>) => void;
}

// プロンプトテンプレート／複数プロンプトテンプレートの「適用」で開く、
// 変数の値をまとめて入力するダイアログの中身。入力値の状態はここで持ち、
// 「反映」で変数名→値のマップを呼び出し側に渡す（置換処理は呼び出し側）。
// 呼び出し側はテンプレートごとに `key` を変えてマウントし直すことで、別の
// テンプレートを開いたときに前回の入力値が残らないようにしている。
export default function TemplateVariableDialog({
  variables,
  fieldsId,
  onCancel,
  onConfirm,
}: TemplateVariableDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((name) => [name, '']))
  );

  return (
    <>
      <h2>テンプレートの変数を入力</h2>
      <div id={fieldsId}>
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
      <ModalButtons onCancel={onCancel} onConfirm={() => onConfirm(values)} confirmLabel="反映" />
    </>
  );
}
