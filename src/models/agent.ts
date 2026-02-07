export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutput: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  inputPricePerMToken: number;
  outputPricePerMToken: number;
  tier: 'economy' | 'standard' | 'premium' | 'research';
}

export const MODEL_REGISTRY: ModelInfo[] = [
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    contextWindow: 200000,
    maxOutput: 8192,
    supportsTools: true,
    supportsStreaming: true,
    inputPricePerMToken: 3.0,
    outputPricePerMToken: 15.0,
    tier: 'standard',
  },
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    contextWindow: 200000,
    maxOutput: 32000,
    supportsTools: true,
    supportsStreaming: true,
    inputPricePerMToken: 15.0,
    outputPricePerMToken: 75.0,
    tier: 'premium',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    contextWindow: 128000,
    maxOutput: 16384,
    supportsTools: true,
    supportsStreaming: true,
    inputPricePerMToken: 2.5,
    outputPricePerMToken: 10.0,
    tier: 'standard',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    contextWindow: 1000000,
    maxOutput: 65536,
    supportsTools: true,
    supportsStreaming: true,
    inputPricePerMToken: 1.25,
    outputPricePerMToken: 10.0,
    tier: 'standard',
  },
  {
    id: 'perplexity/sonar-deep-research',
    name: 'Sonar Deep Research',
    provider: 'Perplexity',
    contextWindow: 128000,
    maxOutput: 8192,
    supportsTools: false,
    supportsStreaming: true,
    inputPricePerMToken: 2.0,
    outputPricePerMToken: 8.0,
    tier: 'research',
  },
  {
    id: 'perplexity/sonar-pro',
    name: 'Sonar Pro',
    provider: 'Perplexity',
    contextWindow: 200000,
    maxOutput: 8192,
    supportsTools: false,
    supportsStreaming: true,
    inputPricePerMToken: 3.0,
    outputPricePerMToken: 15.0,
    tier: 'research',
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    contextWindow: 200000,
    maxOutput: 8192,
    supportsTools: true,
    supportsStreaming: true,
    inputPricePerMToken: 0.8,
    outputPricePerMToken: 4.0,
    tier: 'economy',
  },
];

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODEL_REGISTRY.find(m => m.id === modelId);
}

export function getModelsByTier(tier: ModelInfo['tier']): ModelInfo[] {
  return MODEL_REGISTRY.filter(m => m.tier === tier);
}

export function estimateCost(
  promptTokens: number,
  completionTokens: number,
  modelId: string,
): number {
  const model = getModelInfo(modelId);
  if (!model) return 0;
  return (
    (promptTokens / 1_000_000) * model.inputPricePerMToken +
    (completionTokens / 1_000_000) * model.outputPricePerMToken
  );
}
