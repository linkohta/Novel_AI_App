import Section from './Section';

interface PromptSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  onFocusField: (key: string) => void;
}

export default function PromptSection({
  open,
  onToggle,
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  onFocusField,
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
    </Section>
  );
}
