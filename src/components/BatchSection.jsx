import Section from './Section.jsx';

export default function BatchSection({
  open,
  onToggle,
  batchCount,
  setBatchCount,
  batchInterval,
  setBatchInterval,
  onStartBatch,
  onStopBatch,
  batchRunning,
  batchStatus,
}) {
  return (
    <Section id="batchSection" title="連続生成" open={open} onToggle={onToggle}>
      <div className="row">
        <div>
          <label>生成回数</label>
          <input
            type="number"
            min="1"
            max="100"
            value={batchCount}
            onChange={(e) => setBatchCount(e.target.value)}
          />
        </div>
        <div>
          <label>生成間隔（秒）</label>
          <input
            type="number"
            min="1"
            max="120"
            value={batchInterval}
            onChange={(e) => setBatchInterval(e.target.value)}
          />
        </div>
      </div>
      <div className="row">
        <div>
          <button type="button" onClick={onStartBatch} disabled={batchRunning}>
            連続生成する
          </button>
        </div>
        <div>
          <button
            type="button"
            className="secondary"
            onClick={onStopBatch}
            disabled={!batchRunning}
          >
            中断する
          </button>
        </div>
      </div>
      <div id="batchStatus" className="file-info">
        {batchStatus}
      </div>
    </Section>
  );
}
