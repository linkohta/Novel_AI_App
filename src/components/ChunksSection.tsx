import type { NamedItem } from '../types/domain';

interface ChunksSectionProps {
  chunks: NamedItem[];
  chunkNameInput: string;
  setChunkNameInput: (value: string) => void;
  onSaveChunk: () => void;
  onInsertChunk: (chunk: NamedItem) => void;
  onEditChunk: (chunk: NamedItem) => void;
  onDeleteChunk: (id: string) => void;
}

export default function ChunksSection({
  chunks,
  chunkNameInput,
  setChunkNameInput,
  onSaveChunk,
  onInsertChunk,
  onEditChunk,
  onDeleteChunk,
}: ChunksSectionProps) {
  return (
    <div className="manage-block">
      <h3>プロンプトチャンク</h3>
      <p className="hint">
        プロンプト欄の内容に名前を付けて保存できます。チップをクリックすると直前にフォーカスしていたプロンプト欄へ挿入されます。
      </p>
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
    </div>
  );
}
