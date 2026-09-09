import Section from './Section';

const MODEL_OPTIONS = [
  'nai-diffusion-3',
  'nai-diffusion-4-full',
  'nai-diffusion-4-curated-preview',
  'nai-diffusion-4-5-full',
  'nai-diffusion-4-5-curated',
  'nai-diffusion-5-full',
  'nai-diffusion-5-curated',
];

const SAMPLER_OPTIONS = ['k_euler_ancestral', 'k_euler', 'k_dpmpp_2s_ancestral', 'k_dpmpp_2m'];

const SIZE_OPTIONS = [
  { label: '縦長', width: 832, height: 1216 },
  { label: '横長', width: 1216, height: 832 },
  { label: '正方形', width: 1024, height: 1024 },
];

interface ModelSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  model: string;
  setModel: (value: string) => void;
  width: string;
  setWidth: (value: string) => void;
  height: string;
  setHeight: (value: string) => void;
  steps: string;
  setSteps: (value: string) => void;
  scale: string;
  setScale: (value: string) => void;
  sampler: string;
  setSampler: (value: string) => void;
  seed: string;
  setSeed: (value: string) => void;
  qualityToggle: boolean;
  setQualityToggle: (value: boolean) => void;
  varietyPlus: boolean;
  setVarietyPlus: (value: boolean) => void;
}

export default function ModelSection({
  open,
  onToggle,
  model,
  setModel,
  width,
  setWidth,
  height,
  setHeight,
  steps,
  setSteps,
  scale,
  setScale,
  sampler,
  setSampler,
  seed,
  setSeed,
  qualityToggle,
  setQualityToggle,
  varietyPlus,
  setVarietyPlus,
}: ModelSectionProps) {
  return (
    <Section id="modelSection" title="モデル" open={open} onToggle={onToggle}>
      <label>モデル</label>
      <select value={model} onChange={(e) => setModel(e.target.value)}>
        {MODEL_OPTIONS.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <label className="char-enable">
        <input
          type="checkbox"
          checked={qualityToggle}
          onChange={(e) => setQualityToggle(e.target.checked)}
        />
        Quality Tagsを自動追加する
      </label>
      <p className="hint">
        プロンプトにQuality Tagsを手動で追加済みの場合は、二重追加を避けるためOFFにしてください。
      </p>

      <label className="char-enable">
        <input
          type="checkbox"
          checked={varietyPlus}
          onChange={(e) => setVarietyPlus(e.target.checked)}
        />
        Variety+（多様性を高める）
      </label>
      <p className="hint">
        公式サイトの「Variety+」と同じく、CFGの適用範囲を制限して構図の多様性を高めます（V4系・V5系モデルのみ有効）。
      </p>

      <label>画像サイズ</label>
      <div className="row">
        {SIZE_OPTIONS.map((option) => {
          const selected = width === String(option.width) && height === String(option.height);
          return (
            <button
              key={option.label}
              type="button"
              className={selected ? '' : 'secondary'}
              onClick={() => {
                setWidth(String(option.width));
                setHeight(String(option.height));
              }}
            >
              {`${option.label}（${option.width}×${option.height}）`}
            </button>
          );
        })}
      </div>

      <div className="row">
        <div>
          <label>ステップ数</label>
          <input type="number" value={steps} onChange={(e) => setSteps(e.target.value)} />
        </div>
        <div>
          <label>スケール</label>
          <input
            type="number"
            step="0.5"
            value={scale}
            onChange={(e) => setScale(e.target.value)}
          />
        </div>
      </div>

      <label>サンプラー</label>
      <select value={sampler} onChange={(e) => setSampler(e.target.value)}>
        {SAMPLER_OPTIONS.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <label>シード (0でランダム)</label>
      <input type="number" value={seed} onChange={(e) => setSeed(e.target.value)} />
    </Section>
  );
}
