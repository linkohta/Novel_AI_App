import type { ChangeEvent } from 'react';
import CharacterCard from '../CharacterCard';
import VibeTransferList from '../VibeTransferList';
import type { VibeTransferField } from '../VibeTransferCard';
import type { QueueCharacter, QueueItem } from '../../types/domain';

// 折りたたみ時の見出しに表示するプロンプト冒頭の最大文字数。長いプロンプトを
// そのまま出すと見出しが何行にもなり、行をしまい込んだ意味が薄れるため切り詰める。
const PREVIEW_MAX_LENGTH = 40;

function truncatePreview(text: string): string {
  const chars = Array.from(text);
  return chars.length > PREVIEW_MAX_LENGTH
    ? `${chars.slice(0, PREVIEW_MAX_LENGTH).join('')}…`
    : text;
}

// 複数プロンプト連続生成の1行に対する操作一式。すべて行のindexを第一引数に
// 取る。PromptQueueSection→QueueItemCardへそのまま渡すため1つの型にまとめている。
export interface QueueItemHandlers {
  onChange: (index: number, field: 'prompt' | 'negativePrompt' | 'count', value: string) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onFocusField: (key: string) => void;
  onAddCharacter: (index: number) => void;
  onRemoveCharacter: (index: number, charIndex: number) => void;
  onChangeCharacter: (
    index: number,
    charIndex: number,
    field: keyof QueueCharacter,
    value: string | boolean
  ) => void;
  onLoadImageMetadata: (index: number, e: ChangeEvent<HTMLInputElement>) => void;
  onAddVibeTransferImage: (index: number, e: ChangeEvent<HTMLInputElement>) => void;
  onAddVibeTransferSetFile: (index: number, e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveVibeTransferImage: (index: number, vibeId: string) => void;
  onBalanceVibeTransferStrengths: (index: number) => void;
  onChangeVibeTransferField: (
    index: number,
    vibeId: string,
    field: VibeTransferField,
    value: number
  ) => void;
}

interface QueueItemCardProps {
  index: number;
  item: QueueItem;
  handlers: QueueItemHandlers;
}

// 複数プロンプト連続生成の1行分のカード。既定で折りたたまれ、見出しに
// プロンプト冒頭を表示する（開閉状態は永続化しない）。
export default function QueueItemCard({ index, item, handlers }: QueueItemCardProps) {
  const characters = item.characters || [];
  const vibeTransferImages = item.vibeTransferImages || [];
  const previewText = truncatePreview(item.prompt.trim() || '(プロンプト未入力)');

  return (
    <details className="char-card">
      <summary>{`${index + 1}. ${previewText}`}</summary>
      <button type="button" className="remove-char" onClick={() => handlers.onRemove(index)}>
        削除
      </button>

      <div className="row">
        <div>
          <button type="button" className="secondary" onClick={() => handlers.onMoveUp(index)}>
            ↑
          </button>
          <button type="button" className="secondary" onClick={() => handlers.onMoveDown(index)}>
            ↓
          </button>
        </div>
        <div>
          <label>枚数</label>
          <input
            type="number"
            min="1"
            max="100"
            value={item.count}
            onChange={(e) => handlers.onChange(index, 'count', e.target.value)}
          />
        </div>
      </div>

      <label>画像から読み込み</label>
      <p className="hint">
        NovelAIで生成されたPNG画像を選択すると、この行のプロンプト・ネガティブプロンプト・キャラクタープロンプトを読み込んだ内容で置き換えます。
      </p>
      <input
        type="file"
        accept="image/png"
        onChange={(e) => handlers.onLoadImageMetadata(index, e)}
      />

      <label>{`${index + 1}. プロンプト`}</label>
      <textarea
        value={item.prompt}
        onChange={(e) => handlers.onChange(index, 'prompt', e.target.value)}
        onFocus={() => handlers.onFocusField(`queue:${item.id}:prompt`)}
      />

      <label>ネガティブプロンプト</label>
      <textarea
        value={item.negativePrompt}
        onChange={(e) => handlers.onChange(index, 'negativePrompt', e.target.value)}
        onFocus={() => handlers.onFocusField(`queue:${item.id}:negativePrompt`)}
      />

      <label>キャラクタープロンプト</label>
      {characters.map((character, charIndex) => (
        <details className="char-fold" key={character.id}>
          <summary>{`キャラクター${charIndex + 1}`}</summary>
          <CharacterCard
            index={charIndex}
            character={character}
            onChange={(ci, field, value) => handlers.onChangeCharacter(index, ci, field, value)}
            onRemove={(ci) => handlers.onRemoveCharacter(index, ci)}
            onFocusField={(fieldKey) => handlers.onFocusField(`queue:${item.id}:${fieldKey}`)}
          />
        </details>
      ))}
      <button type="button" className="secondary" onClick={() => handlers.onAddCharacter(index)}>
        ＋ キャラクターを追加
      </button>

      <details className="char-fold">
        <summary>AIポーション（Vibe Transfer）</summary>
        <VibeTransferList
          images={vibeTransferImages}
          onChangeField={(vibeId, field, value) =>
            handlers.onChangeVibeTransferField(index, vibeId, field, value)
          }
          onRemove={(vibeId) => handlers.onRemoveVibeTransferImage(index, vibeId)}
          onBalance={() => handlers.onBalanceVibeTransferStrengths(index)}
          onAddImage={(e) => handlers.onAddVibeTransferImage(index, e)}
          onAddSetFile={(e) => handlers.onAddVibeTransferSetFile(index, e)}
          setFileLabel="＋ ポーションセットファイルを読み込む（.naiv4vibe / .naiv4vibeBundle）"
        />
      </details>
    </details>
  );
}
