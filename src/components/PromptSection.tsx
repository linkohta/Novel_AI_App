import Section from './Section';
import type { NamedItem } from '../types/domain';

interface PromptSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  onFocusField: (key: string) => void;
  chunks: NamedItem[];
  chunkNameInput: string;
  setChunkNameInput: (value: string) => void;
  onSaveChunk: () => void;
  onInsertChunk: (chunk: NamedItem) => void;
  onEditChunk: (chunk: NamedItem) => void;
  onDeleteChunk: (id: string) => void;
}

export default function PromptSection({
  open,
  onToggle,
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  onFocusField,
  chunks,
  chunkNameInput,
  setChunkNameInput,
  onSaveChunk,
  onInsertChunk,
  onEditChunk,
  onDeleteChunk,
}: PromptSectionProps) {
  return (
    <Section id="promptSection" title="プロンプト" open={open} onToggle={onToggle}>
      <label>プロンプト</label>
      <textarea
        placeholder="1girl, silver hair, ..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onFocus={() => onFocusField('prompt')}
      />

      <label>ネガティブプロンプト</label>
      <textarea
        placeholder="lowres, bad anatomy, ..."
        value={negativePrompt}
        onChange={(e) => setNegativePrompt(e.target.value)}
        onFocus={() => onFocusField('negativePrompt')}
      />

      <div className="chunk-row">
        <input
          type="text"
          placeholder="チャンク名"
          value={chunkNameInput}
          onChange={(e) => setChunkNameInput(e.target.value)}
        />
        <button type="button" onClick={onSaveChunk}>
          プロンプトを保存
        </button>
      </div>
      <div id="chunkList">
        {chunks.map((chunk) => (
          <div className="chunk-chip" key={chunk.id}>
            <span className="chunk-insert" title={chunk.text} onClick={() => onInsertChunk(chunk)}>
              {chunk.name}
            </span>
            <span className="chunk-edit" onClick={() => onEditChunk(chunk)}>
              ✎
            </span>
            <span className="chunk-delete" onClick={() => onDeleteChunk(chunk.id)}>
              ×
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
