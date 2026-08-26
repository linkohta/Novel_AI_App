import Section from './Section.jsx';

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
}) {
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

      <div className="row">
        <div>
          <label>幅</label>
          <input type="number" step="64" value={width} onChange={(e) => setWidth(e.target.value)} />
        </div>
        <div>
          <label>高さ</label>
          <input
            type="number"
            step="64"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
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
