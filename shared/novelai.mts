export function isV4Model(model: string): boolean {
  return /^nai-diffusion-[45]/.test(model);
}

// モデルごとのQuality Tags(Standard)文字列。
// 公式サイトはV4系・V5系ではこの文字列をクライアント側でプロンプト末尾へ
// 連結して送信している（`qualityToggle`によるサーバー側付与ではない）。
// 実際に公式サイトで生成したPNGの`Comment`チャンクから取得した送信内容で
// `nai-diffusion-4-5-full`の値を実証済み。
const QUALITY_TAGS: Record<string, string> = {
  'nai-diffusion-5-full': 'very aesthetic, masterpiece, no text',
  'nai-diffusion-5-curated': 'very aesthetic, masterpiece, no text',
  'nai-diffusion-4-5-full': 'very aesthetic, masterpiece, no text',
  'nai-diffusion-4-5-curated': 'very aesthetic, masterpiece, no text, -0.8::feet::, rating:general',
  'nai-diffusion-4-full': 'no text, best quality, very aesthetic, absurdres',
  'nai-diffusion-4-curated-preview': 'rating:general, best quality, very aesthetic, absurdres',
};

const DEFAULT_QUALITY_TAGS = 'very aesthetic, masterpiece, no text';

// 公式サイトの「Variety+」トグルON時に`skip_cfg_above_sigma`へ設定される
// モデルごとの値。V5系はテーブル上nullのため、ONでもnullのまま送る。
const SKIP_CFG_ABOVE_SIGMA: Record<string, number | null> = {
  'nai-diffusion-5-full': null,
  'nai-diffusion-5-curated': null,
  'nai-diffusion-4-5-full': 58,
  'nai-diffusion-4-5-curated': 58,
  'nai-diffusion-4-full': 19,
  'nai-diffusion-4-curated-preview': 16.92517469515569,
  'nai-diffusion-3': 9.36441710371274,
  'nai-diffusion-furry-3': 11.84515480302779,
};

// 1個以上の"/"区切りセグメントからなるバッチフォルダパス
// （例: "queue_123/prompt1"）をサニタイズする。ネストしたサブフォルダが
// 機能し続けるよう、各セグメントごとに個別に不正な文字を取り除く。
// 生成画像を出力ディレクトリ配下の任意のbatch/queueサブフォルダに書き込む
// main.js（Electron）とcapacitorBridge.js（Android）の両方で共有される。
export function sanitizeBatchFolder(batchFolder?: string | null): string {
  if (!batchFolder) return '';
  return String(batchFolder)
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ''))
    .filter(Boolean)
    .join('/');
}

export interface CharacterPromptInput {
  prompt?: string;
  negativePrompt?: string;
  enabled?: boolean;
}

// AIポーション（Vibe Transfer）用の参照画像1件分の入力。
export interface VibeTransferImageInput {
  image: string;
  informationExtracted?: number;
  referenceStrength?: number;
}

export interface BuildRequestBodyParams {
  width: number | string;
  height: number | string;
  steps: number | string;
  scale: number | string;
  seed?: number | string;
  sampler: string;
  prompt?: string;
  negativePrompt?: string;
  model: string;
  qualityToggle?: boolean;
  characterPrompts?: CharacterPromptInput[];
  vibeTransferImages?: VibeTransferImageInput[];
  // 公式サイトの「Variety+」トグル相当。ONのときモデルごとの
  // `skip_cfg_above_sigma`の値を送る（V4系・V5系のみ）。
  varietyPlus?: boolean;
}

// buildRequestBodyが組み立てるNovelAI APIリクエストの`parameters`は
// モデル種別により付与されるフィールドが異なるため、共通部分＋任意の
// V4系フィールド＋任意のV3系characterPromptsフィールドとして表現する。
export interface NovelaiRequestParameters {
  width: number;
  height: number;
  scale: number;
  sampler: string;
  steps: number;
  seed: number;
  n_samples: number;
  negative_prompt: string;
  qualityToggle: boolean;
  params_version: number;
  dynamic_thresholding: boolean;
  controlnet_strength: number;
  legacy: boolean;
  legacy_v3_extend: boolean;
  cfg_rescale: number;
  sm: boolean;
  sm_dyn: boolean;
  // autoSmeaはV3系のみ送る（公式サイトのV4.5送信内容にはこのフィールド自体が
  // 存在しないため、V4系・V5系では付与しない）。
  autoSmea?: boolean;
  noise_schedule?: string;
  deliberate_euler_ancestral_bug?: boolean;
  prefer_brownian?: boolean;
  legacy_uc?: boolean;
  uncond_scale?: number;
  dynamic_thresholding_percentile?: number;
  dynamic_thresholding_mimic_scale?: number;
  skip_cfg_above_sigma?: number | null;
  skip_cfg_below_sigma?: number;
  cfg_sched_eligibility?: string;
  explike_fine_detail?: boolean;
  minimize_sigma_inf?: boolean;
  controlnet_model?: string | null;
  v4_prompt?: {
    caption: {
      base_caption: string;
      char_captions: { char_caption: string; centers: { x: number; y: number }[] }[];
    };
    use_coords: boolean;
    use_order: boolean;
    legacy_uc: boolean;
  };
  v4_negative_prompt?: {
    caption: {
      base_caption: string;
      char_captions: { char_caption: string; centers: { x: number; y: number }[] }[];
    };
    use_coords: boolean;
    use_order: boolean;
    legacy_uc: boolean;
  };
  characterPrompts?: { prompt: string; uc: string }[];
  reference_image_multiple?: string[];
  reference_information_extracted_multiple?: number[];
  reference_strength_multiple?: number[];
  uncond_per_vibe?: boolean;
  wonky_vibe_correlation?: boolean;
  normalize_reference_strength_multiple?: boolean;
}

export interface NovelaiRequestBody {
  input: string;
  model: string;
  action: 'generate';
  parameters: NovelaiRequestParameters;
}

export function buildRequestBody(params: BuildRequestBodyParams): NovelaiRequestBody {
  const width = Number(params.width);
  const height = Number(params.height);
  const steps = Number(params.steps);
  const scale = Number(params.scale);
  const seed = Number(params.seed) > 0 ? Number(params.seed) : Math.floor(Math.random() * 2 ** 32);
  const characterPrompts = Array.isArray(params.characterPrompts) ? params.characterPrompts : [];
  const v4Model = isV4Model(params.model);
  const qualityToggle = params.qualityToggle !== false;

  // V4系・V5系では公式サイトと同様にQuality Tagsをクライアント側で
  // プロンプト末尾へ連結し、サーバー側での二重付与を防ぐため
  // `qualityToggle`は必ずfalseを送る。V3系は従来通りサーバー側に任せる。
  const basePrompt = params.prompt || '';
  const appendQualityTags = v4Model && qualityToggle;
  const qualityTags = QUALITY_TAGS[params.model] || DEFAULT_QUALITY_TAGS;
  const inputPrompt = appendQualityTags
    ? basePrompt
      ? `${basePrompt}, ${qualityTags}`
      : qualityTags
    : basePrompt;

  const parameters: NovelaiRequestParameters = {
    width,
    height,
    scale,
    sampler: params.sampler,
    steps,
    seed,
    n_samples: 1,
    negative_prompt: params.negativePrompt || '',
    qualityToggle: v4Model ? false : qualityToggle,
    params_version: 3,
    dynamic_thresholding: false,
    controlnet_strength: 1,
    legacy: false,
    legacy_v3_extend: false,
    cfg_rescale: 0,
    sm: false,
    sm_dyn: false,
  };

  if (!v4Model) {
    // V3系では従来通り、公式サイトの「Auto」トグルと同様に1024x1024pxを
    // 超える解像度でSMEAを自動適用させる。V4系・V5系は公式サイトの送信内容に
    // このフィールド自体が存在しないため送らない。
    parameters.autoSmea = true;
  }

  if (v4Model) {
    // V4/V4.5/V5モデルにおける公式サイトの送信内容に合わせる —— これらは
    // プロンプト内容ではなく実際の拡散サンプリングそのものを左右するため、
    // 省略すると同じプロンプト/シード/サンプラーでも大きく異なる画像になる。
    // 値は公式サイトで生成したPNGの`Comment`チャンクに記録された実際の
    // 送信パラメータから取得している。
    parameters.noise_schedule = 'karras';
    parameters.deliberate_euler_ancestral_bug = false;
    parameters.prefer_brownian = true;
    parameters.legacy_uc = false;
    parameters.uncond_scale = 0;
    parameters.dynamic_thresholding_percentile = 0.999;
    parameters.dynamic_thresholding_mimic_scale = 10;
    parameters.skip_cfg_below_sigma = 0;
    parameters.cfg_sched_eligibility = 'enable_for_post_summer_samplers';
    parameters.explike_fine_detail = false;
    parameters.minimize_sigma_inf = false;
    parameters.controlnet_model = null;
    // 「Variety+」ON時はモデルごとの値、OFF時はnullを送る。
    parameters.skip_cfg_above_sigma = params.varietyPlus
      ? (SKIP_CFG_ABOVE_SIGMA[params.model] ?? null)
      : null;

    parameters.v4_prompt = {
      caption: {
        base_caption: inputPrompt,
        char_captions: characterPrompts.map((c) => ({
          char_caption: c.prompt || '',
          centers: [{ x: 0.5, y: 0.5 }],
        })),
      },
      use_coords: false,
      use_order: true,
      legacy_uc: false,
    };
    parameters.v4_negative_prompt = {
      caption: {
        base_caption: params.negativePrompt || '',
        char_captions: characterPrompts.map((c) => ({
          char_caption: c.negativePrompt || '',
          centers: [{ x: 0.5, y: 0.5 }],
        })),
      },
      use_coords: false,
      use_order: false,
      legacy_uc: false,
    };
  } else if (characterPrompts.length) {
    parameters.characterPrompts = characterPrompts.map((c) => ({
      prompt: c.prompt || '',
      uc: c.negativePrompt || '',
    }));
  }

  // AIポーション（Vibe Transfer）: 参照画像が1枚以上ある場合のみ、
  // 参照画像とReference Strengthの2つの並行配列（同じ順序・同じ長さ）を
  // parametersに付与する。
  // V3/V4/V5いずれのモデルでも同じ形式のため、モデル種別による分岐は不要。
  const vibeTransferImages = Array.isArray(params.vibeTransferImages)
    ? params.vibeTransferImages
    : [];
  if (vibeTransferImages.length) {
    parameters.reference_image_multiple = vibeTransferImages.map((v) => v.image);
    // `reference_information_extracted_multiple` は意図的に一切送信しない
    // （キー自体を付与しない）。理由は次の3点を突き合わせた結果:
    //   1. 公式サイトで生成した画像のPNGメタデータでは、参照画像4枚に対して
    //      `reference_information_extracted_multiple: []` と空配列になっている。
    //   2. 本アプリが `[1,1,1,1]` を送って生成した画像のメタデータには、
    //      その `[1,1,1,1]` がそのまま記録されている——つまりこのフィールドは
    //      記録時に伏せられているのではなく、送った値がそのまま残る。
    //      したがって上記1は「公式は値を送っていない」ことの証拠になる。
    //   3. 一方で空配列 `[]` を明示的に送ると、APIは
    //      `400 Validation error: ... must be the same length` を返す。
    // 以上より、APIの検証は「キーが存在する場合のみ長さを照合する」もので、
    // 公式サイトはキーごと省略していると判断できる。Information Extractedの
    // 値はエンコード済みvibeデータ側に既に織り込まれているため、送信しなくても
    // UI上のInformation Extracted表示の意味は失われない。
    parameters.reference_strength_multiple = vibeTransferImages.map((v) =>
      typeof v.referenceStrength === 'number' ? v.referenceStrength : 0.6
    );
    parameters.uncond_per_vibe = true;
    parameters.wonky_vibe_correlation = true;
    parameters.normalize_reference_strength_multiple = true;
  }

  return {
    input: inputPrompt,
    model: params.model,
    action: 'generate',
    parameters,
  };
}

export const NOVELAI_IMAGE_ENDPOINT = 'https://image.novelai.net/ai/generate-image';
export const NOVELAI_SUBSCRIPTION_ENDPOINT = 'https://api.novelai.net/user/subscription';
// V4系・V5系モデルでAIポーション（Vibe Transfer）の参照画像を事前エンコード
// するための専用エンドポイント（1回の呼び出しにつき2 Anlas消費）。
export const NOVELAI_ENCODE_VIBE_ENDPOINT = 'https://image.novelai.net/ai/encode-vibe';

export interface OpusPerk {
  maxPrompts: number;
  resolution: number;
  resetAfter: number;
}

export interface SubscriptionInfo {
  anlas: number;
  opusPerks: OpusPerk[];
}

// NovelAI /user/subscription APIのレスポンス形状は一部のみ利用するため
// 必要なプロパティだけを緩く型付けする（unknownな追加フィールドを含みうる）。
export interface RawSubscriptionData {
  trainingStepsLeft?: {
    fixedTrainingStepsLeft?: number;
    purchasedTrainingStepsLeft?: number;
  };
  perks?: {
    unlimitedImageGeneration?: OpusPerk[];
  };
}

export function parseSubscriptionInfo(data: RawSubscriptionData): SubscriptionInfo {
  const trainingStepsLeft = data.trainingStepsLeft || {};
  const anlas =
    (trainingStepsLeft.fixedTrainingStepsLeft || 0) +
    (trainingStepsLeft.purchasedTrainingStepsLeft || 0);
  const opusPerks = Array.isArray(data.perks?.unlimitedImageGeneration)
    ? data.perks.unlimitedImageGeneration
    : [];
  return {
    anlas,
    opusPerks: opusPerks.map((p) => ({
      maxPrompts: p.maxPrompts,
      resolution: p.resolution,
      resetAfter: p.resetAfter,
    })),
  };
}
