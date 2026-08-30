export function isV4Model(model) {
  return /^nai-diffusion-[45]/.test(model);
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
    // SMEA/SMEA DYN off, but let the site auto-enable SMEA for resolutions
    // above 1024x1024 (its "Auto" toggle) the same way the website does —
    // otherwise higher-resolution generations lose the anatomy/coherency
    // correction SMEA provides and come out lower quality than the website.
    sm: false,
    sm_dyn: false,
    autoSmea: true,
  };

  if (isV4Model(params.model)) {
    // Matches the official site's defaults for V4/V4.5 models (novelai-api's
    // presets_v4/default.preset) so results line up with the website for the
    // same prompt/seed/sampler — these change the actual diffusion sampling,
    // not just prompt content, so omitting them yields very different images.
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
