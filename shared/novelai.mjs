export function isV4Model(model) {
  return /^nai-diffusion-[45]/.test(model);
}

// 1個以上の"/"区切りセグメントからなるバッチフォルダパス
// （例: "queue_123/prompt1"）をサニタイズする。ネストしたサブフォルダが
// 機能し続けるよう、各セグメントごとに個別に不正な文字を取り除く。
// 生成画像を出力ディレクトリ配下の任意のbatch/queueサブフォルダに書き込む
// main.js（Electron）とcapacitorBridge.js（Android）の両方で共有される。
export function sanitizeBatchFolder(batchFolder) {
  if (!batchFolder) return '';
  return String(batchFolder)
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ''))
    .filter(Boolean)
    .join('/');
}

export function buildRequestBody(params) {
  const width = Number(params.width);
  const height = Number(params.height);
  const steps = Number(params.steps);
  const scale = Number(params.scale);
  const seed = Number(params.seed) > 0 ? Number(params.seed) : Math.floor(Math.random() * 2 ** 32);
  const characterPrompts = Array.isArray(params.characterPrompts) ? params.characterPrompts : [];

  const parameters = {
    width,
    height,
    scale,
    sampler: params.sampler,
    steps,
    seed,
    n_samples: 1,
    negative_prompt: params.negativePrompt || '',
    qualityToggle: params.qualityToggle !== false,
    params_version: 3,
    dynamic_thresholding: false,
    controlnet_strength: 1,
    legacy: false,
    legacy_v3_extend: false,
    cfg_rescale: 0,
    // SMEA/SMEA DYNはOFFだが、公式サイトと同様に1024x1024pxを超える解像度では
    // SMEAを自動的に有効化させる（サイトの「Auto」トグルと同じ挙動）——
    // そうしないと高解像度の生成でSMEAによる構図・アナトミーの補正が働かず、
    // 公式サイトより低品質な結果になってしまう。
    sm: false,
    sm_dyn: false,
    autoSmea: true,
  };

  if (isV4Model(params.model)) {
    // V4/V4.5モデルにおける公式サイトの既定値（novelai-apiの
    // presets_v4/default.preset）に合わせることで、同じプロンプト/シード/
    // サンプラーでの結果を公式サイトと一致させる —— これらはプロンプト内容
    // ではなく実際の拡散サンプリングそのものを左右するため、省略すると
    // 大きく異なる画像になる。
    parameters.noise_schedule = 'karras';
    parameters.deliberate_euler_ancestral_bug = false;
    parameters.prefer_brownian = true;
    parameters.legacy_uc = false;

    parameters.v4_prompt = {
      caption: {
        base_caption: params.prompt || '',
        char_captions: characterPrompts.map((c) => ({
          char_caption: c.prompt || '',
          centers: [{ x: 0.5, y: 0.5 }],
        })),
      },
      use_coords: false,
      use_order: true,
    };
    parameters.v4_negative_prompt = {
      caption: {
        base_caption: params.negativePrompt || '',
        char_captions: characterPrompts.map((c) => ({
          char_caption: c.negativePrompt || '',
          centers: [{ x: 0.5, y: 0.5 }],
        })),
      },
    };
  } else if (characterPrompts.length) {
    parameters.characterPrompts = characterPrompts.map((c) => ({
      prompt: c.prompt || '',
      uc: c.negativePrompt || '',
    }));
  }

  return {
    input: params.prompt || '',
    model: params.model,
    action: 'generate',
    parameters,
  };
}

export const NOVELAI_IMAGE_ENDPOINT = 'https://image.novelai.net/ai/generate-image';
export const NOVELAI_SUBSCRIPTION_ENDPOINT = 'https://api.novelai.net/user/subscription';

export function parseSubscriptionInfo(data) {
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
