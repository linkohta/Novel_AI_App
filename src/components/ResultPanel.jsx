export default function ResultPanel({ resultImage, fileInfo, history, onSelectHistory }) {
  return (
    <div className="panel right">
      <img id="result-image" className={resultImage ? 'visible' : ''} src={resultImage || ''} />
      <div className="file-info" id="file-info">
        {fileInfo}
      </div>
      <div id="history">
        {history.map((item, index) => (
          <img
            key={index}
            src={item.dataUrl}
            title={item.fileName}
            onClick={() => onSelectHistory(item)}
          />
        ))}
      </div>
    </div>
  );
}
