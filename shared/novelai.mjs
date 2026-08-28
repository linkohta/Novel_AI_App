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
  };

  if (isV4Model(params.model)) {
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
