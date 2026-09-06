import {
  assistantSchema,
  assignmentSchema,
  bugPrioritizationSchema,
  meetingSchema,
  projectHealthSchema,
  releaseNotesSchema,
  sprintRiskSchema,
  taskGenerationSchema
} from './schemas/aiSchemas.js';

const DEFAULT_MODEL = 'gemini-3.7-flash';
const DEFAULT_FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
];

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uniqueModels = (models) => [...new Set(models.map(cleanText).filter(Boolean))];

const parseJsonSafely = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced) return JSON.parse(fenced[1]);
    throw new Error('AI returned an invalid JSON response.');
  }
};

const validateBasicShape = (value, schema) => {
  if (!value || typeof value !== 'object') {
    throw new Error('AI returned an empty response.');
  }

  if (schema === taskGenerationSchema && !Array.isArray(value.tasks)) {
    throw new Error('AI task response is malformed.');
  }

  if (schema === assignmentSchema && !Array.isArray(value.recommendations)) {
    throw new Error('AI assignment response is malformed.');
  }

  if (schema === meetingSchema && !Array.isArray(value.actionItems)) {
    throw new Error('AI meeting response is malformed.');
  }

  return value;
};

const getModelList = () => {
  const configuredModel = cleanText(process.env.AI_MODEL) || DEFAULT_MODEL;
  const configuredFallbacks = cleanText(process.env.AI_FALLBACK_MODELS)
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  return uniqueModels([
    configuredModel,
    ...configuredFallbacks,
    ...DEFAULT_FALLBACK_MODELS
  ]);
};

const isRetryableProviderError = (status) =>
  status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;

const getThinkingConfig = (model, thinkingLevel) => {
  if (model === 'gemini-3.7-flash' || model === 'gemini-3.8-flash') {
    return { thinkingLevel };
  }
  return undefined;
};

const callGeminiModel = async ({
  model,
  apiKey,
  prompt,
  schema,
  maxOutputTokens,
  thinkingLevel
}) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const generationConfig = {
    responseMimeType: 'application/json',
    responseSchema: schema,
    maxOutputTokens
  };

  const thinkingConfig = getThinkingConfig(model, thinkingLevel);
  if (thinkingConfig) {
    generationConfig.thinkingConfig = thinkingConfig;
  }

  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    generationConfig
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || `Gemini request failed with status ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.providerModel = model;
    error.retryable = isRetryableProviderError(response.status);
    throw error;
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('') || '';

  if (!text) {
    const error = new Error('Gemini returned no content.');
    error.statusCode = 502;
    error.providerModel = model;
    error.retryable = true;
    throw error;
  }

  return validateBasicShape(parseJsonSafely(text), schema);
};

const callGemini = async ({
  prompt,
  schema,
  maxOutputTokens = 5000,
  thinkingLevel = 'low'
}) => {
  const apiKey = cleanText(process.env.GEMINI_API_KEY);

  if (!apiKey || apiKey === 'your_gemini_api_key') {
    const error = new Error('GEMINI_API_KEY is not configured. Add your real Gemini API key to backEnd/.env.');
    error.statusCode = 503;
    throw error;
  }

  const models = getModelList();
  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const result = await callGeminiModel({
          model,
          apiKey,
          prompt,
          schema,
          maxOutputTokens,
          thinkingLevel
        });

        if (model !== models[0]) {
          console.log(`AI fallback succeeded with model: ${model}`);
        }

        return result;
      } catch (error) {
        lastError = error;

        const isLastAttemptForModel = attempt === 2;
        if (!error.retryable) {
          throw error;
        }

        if (!isLastAttemptForModel) {
          console.warn(`AI model ${model} unavailable (attempt ${attempt}). Retrying...`);
          await sleep(1200 * attempt);
        } else {
          console.warn(`AI model ${model} unavailable. Trying next model...`);
        }
      }
    }
  }

  const finalError = new Error(
    lastError?.message || 'All configured Gemini models are temporarily unavailable.'
  );
  finalError.statusCode = 503;
  finalError.providerModel = lastError?.providerModel;
  finalError.retryable = true;
  throw finalError;
};

export const getAIStatus = () => {
  const models = getModelList();
  return {
    provider: 'Google Gemini',
    model: models[0],
    fallbackModels: models.slice(1),
    configured: Boolean(
      cleanText(process.env.GEMINI_API_KEY) &&
      cleanText(process.env.GEMINI_API_KEY) !== 'your_gemini_api_key'
    )
  };
};

export const generateTasks = (args) =>
  callGemini({
    prompt: args.prompt,
    schema: taskGenerationSchema,
    maxOutputTokens: 5000,
    thinkingLevel: 'low'
  });

export const analyzeSprintRisk = (args) =>
  callGemini({
    prompt: args.prompt,
    schema: sprintRiskSchema,
    maxOutputTokens: 2500,
    thinkingLevel: 'low'
  });

export const recommendAssignment = (args) =>
  callGemini({
    prompt: args.prompt,
    schema: assignmentSchema,
    maxOutputTokens: 3000,
    thinkingLevel: 'low'
  });

export const prioritizeBug = (args) =>
  callGemini({
    prompt: args.prompt,
    schema: bugPrioritizationSchema,
    maxOutputTokens: 2500,
    thinkingLevel: 'low'
  });

export const analyzeProjectHealth = (args) =>
  callGemini({
    prompt: args.prompt,
    schema: projectHealthSchema,
    maxOutputTokens: 3000,
    thinkingLevel: 'low'
  });

export const summarizeMeeting = (args) =>
  callGemini({
    prompt: args.prompt,
    schema: meetingSchema,
    maxOutputTokens: 4000,
    thinkingLevel: 'low'
  });

export const generateReleaseNotes = (args) =>
  callGemini({
    prompt: args.prompt,
    schema: releaseNotesSchema,
    maxOutputTokens: 3000,
    thinkingLevel: 'low'
  });

export const askAssistant = (args) =>
  callGemini({
    prompt: args.prompt,
    schema: assistantSchema,
    maxOutputTokens: 3000,
    thinkingLevel: 'low'
  });
