const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  error?: string;
}

interface OpenRouterConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
}

export async function* streamCompletion(
  messages: ChatMessage[],
  config: OpenRouterConfig,
  signal: AbortSignal,
): AsyncGenerator<StreamChunk> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://llm-tasks.app',
      'X-Title': 'LLM Tasks',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      ...(config.tools && config.tools.length > 0 ? { tools: config.tools } : {}),
    }),
    signal,
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || JSON.stringify(errorData);
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    yield { type: 'error', error: errorMessage };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Track tool call accumulation across chunks
  const toolCallAccumulator: Record<
    number,
    { id: string; name: string; arguments: string }
  > = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') {
        if (trimmed === 'data: [DONE]') {
          // Emit any accumulated tool calls
          for (const tc of Object.values(toolCallAccumulator)) {
            yield { type: 'tool_call', toolCall: tc };
          }
          yield { type: 'done' };
          return;
        }
        continue;
      }

      if (!trimmed.startsWith('data: ')) continue;

      try {
        const data = JSON.parse(trimmed.slice(6));
        const choice = data.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;
        if (!delta) continue;

        // Content chunk
        if (delta.content) {
          yield { type: 'content', content: delta.content };
        }

        // Tool call chunks
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallAccumulator[idx]) {
              toolCallAccumulator[idx] = {
                id: tc.id || '',
                name: tc.function?.name || '',
                arguments: '',
              };
            }
            if (tc.id) toolCallAccumulator[idx].id = tc.id;
            if (tc.function?.name) toolCallAccumulator[idx].name = tc.function.name;
            if (tc.function?.arguments) {
              toolCallAccumulator[idx].arguments += tc.function.arguments;
            }
          }
        }

        // Usage info (usually in the last chunk)
        if (data.usage) {
          yield {
            type: 'done',
            usage: {
              prompt_tokens: data.usage.prompt_tokens,
              completion_tokens: data.usage.completion_tokens,
            },
          };
        }

        // Finish reason
        if (choice.finish_reason === 'tool_calls') {
          for (const tc of Object.values(toolCallAccumulator)) {
            yield { type: 'tool_call', toolCall: tc };
          }
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }

  // Emit any remaining accumulated tool calls
  for (const tc of Object.values(toolCallAccumulator)) {
    if (tc.id && tc.name) {
      yield { type: 'tool_call', toolCall: tc };
    }
  }
  yield { type: 'done' };
}

// Non-streaming completion for simple calls
export async function completion(
  messages: ChatMessage[],
  config: Omit<OpenRouterConfig, 'tools'>,
): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://llm-tasks.app',
      'X-Title': 'LLM Tasks',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}
