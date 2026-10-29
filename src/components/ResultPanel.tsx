import { useState } from 'react';
import type { HistoryItem } from '../types/domain';

// 生成履歴のサムネイルを1ページに表示する件数。連続生成で履歴が増えると
// サムネイルが大量に並んで結果パネルが縦に長くなりすぎるため、ページ分けする。
const HISTORY_PAGE_SIZE = 20;

interface ResultPanelProps {
  resultImage: string;
  fileInfo: string;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
}

export default function ResultPanel({
  resultImage,
  fileInfo,
  history,
  onSelectHistory,
}: ResultPanelProps) {
  // 表示中のページ番号（1始まり）は、他のどこからも参照せず永続化もしない
  // 表示上だけの状態のため、App.tsxではなくこのコンポーネント内で持つ。
  // 新しい画像は履歴の先頭に追加されるが、閲覧中のページを勝手に切り替えない
  // よう、生成のたびに1ページ目へ戻すことはしない。
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = history.slice(
    (currentPage - 1) * HISTORY_PAGE_SIZE,
    currentPage * HISTORY_PAGE_SIZE
  );

  return (
    <div className="panel right">
      {resultImage && <img id="result-image" className="visible" src={resultImage} />}
      <div className="file-info" id="file-info">
        {fileInfo}
      </div>
      <div id="history">
        {pageItems.map((item) => (
          <img
            key={item.fileName}
            src={item.dataUrl}
            title={item.fileName}
            onClick={() => onSelectHistory(item)}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="history-pager">
          <button
            type="button"
            className="secondary"
            onClick={() => setPage(1)}
            disabled={currentPage === 1}
            title="最初のページ"
          >
            «
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹ 前へ
          </button>
          <span className="history-pager-info">
            {currentPage} / {totalPages} ページ（全 {history.length} 件）
          </span>
          <button
            type="button"
            className="secondary"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            次へ ›
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setPage(totalPages)}
            disabled={currentPage === totalPages}
            title="最後のページ"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
