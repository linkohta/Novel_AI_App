import { useState } from 'react';
import ModalButtons from './ModalButtons';
import type { FavoriteOptionGroup } from '../../utils/favorites';

interface TemplateVariableDialogProps {
  // テンプレート本文から検出した変数名の一覧（重複なし）。
  variables: string[];
  // 各変数の入力欄の横に表示する、保存済みのお気に入りの選択肢（種類ごと）。
  favoriteOptionGroups: FavoriteOptionGroup[];
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
  favoriteOptionGroups,
  fieldsId,
  onCancel,
  onConfirm,
}: TemplateVariableDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((name) => [name, '']))
  );
  const hasFavorites = favoriteOptionGroups.length > 0;

  return (
    <>
      <h2>テンプレートの変数を入力</h2>
      {hasFavorites && variables.length > 0 && (
        <p className="hint">
          各欄の右のリストから、保存済みのお気に入り（アーティスト・キャラクター・作品）を選んで入力することもできます。
        </p>
      )}
      <div id={fieldsId}>
        {variables.length === 0 ? (
          <div className="no-vars">このテンプレートに変数はありません。そのまま反映します。</div>
        ) : (
          variables.map((name) => (
            <div className="template-var-field" key={name}>
              <label>{name}</label>
              <div className="template-var-row">
                <input
                  type="text"
                  value={values[name] || ''}
                  onChange={(e) => setValues({ ...values, [name]: e.target.value })}
                />
                {hasFavorites && (
                  // 選んだ値を入力欄へ入れるだけの操作用のため、選択状態は保持せず
                  // 常に先頭の「お気に入りから選択...」に戻す（同じ項目を続けて
                  // 選び直しても反映されるようにするため）。
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setValues({ ...values, [name]: e.target.value });
                    }}
                  >
                    <option value="">お気に入りから選択...</option>
                    {favoriteOptionGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((option) => (
                          <option key={option.key} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <ModalButtons onCancel={onCancel} onConfirm={() => onConfirm(values)} confirmLabel="反映" />
    </>
  );
}
