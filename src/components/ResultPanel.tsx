import type { HistoryItem } from '../types/domain';

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
  return (
    <div className="panel right">
      {resultImage && <img id="result-image" className="visible" src={resultImage} />}
      <div className="file-info" id="file-info">
        {fileInfo}
      </div>
      <div id="history">
        {history.map((item) => (
          <img
            key={item.fileName}
            src={item.dataUrl}
            title={item.fileName}
            onClick={() => onSelectHistory(item)}
          />
        ))}
      </div>
    </div>
  );
}
