import Section from './Section';
import RunControls from './RunControls';

interface BatchSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  batchCount: string;
  setBatchCount: (value: string) => void;
  batchInterval: string;
  setBatchInterval: (value: string) => void;
  onStartBatch: () => void;
  onStopBatch: () => void;
  batchRunning: boolean;
  batchStatus: string;
}

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
}: BatchSectionProps) {
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
      <RunControls
        running={batchRunning}
        onStart={onStartBatch}
        onStop={onStopBatch}
        status={batchStatus}
        statusId="batchStatus"
      />
    </Section>
  );
}
