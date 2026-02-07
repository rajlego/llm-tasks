import type { LLMTask } from '../../models/task';
import type { ConversationMessage } from '../../models/conversation';
import type { ResearchFinding } from '../../models/research';
import { streamCompletion, type ChatMessage } from './openrouter';
import { TOOL_DEFINITIONS } from './tools';
import { buildSystemPrompt, buildTaskPrompt, buildResearchPrompt } from './prompts';
import { useTaskStore } from '../../store/taskStore';
import { useConversationStore } from '../../store/conversationStore';
import { useExecutionStore } from '../../store/executionStore';
import { useSettingsStore } from '../../store/settingsStore';
import { estimateCost } from '../../models/agent';

// Store abort controllers outside of zustand (not serializable)
const abortControllers = new Map<string, AbortController>();

export class PauseExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PauseExecutionError';
  }
}

export async function executeTask(taskId: string): Promise<void> {
  const taskStore = useTaskStore.getState();
  const task = taskStore.getTask(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const settings = useSettingsStore.getState();
  const apiKey = settings.openRouterApiKey;
  if (!apiKey) throw new Error('OpenRouter API key not configured');

  // Set up abort controller
  const controller = new AbortController();
  abortControllers.set(taskId, controller);

  // Mark as executing
  useExecutionStore.getState().markActive(taskId);
  taskStore.transitionTask(taskId, 'in_progress', 'agent', 'Execution started');

  try {
    const strategy = task.executionConfig.researchStrategy;

    if (strategy === 'perplexity') {
      await executePerplexityResearch(task, apiKey, controller.signal);
    } else if (strategy === 'openai_deep') {
      await executeOpenAIDeepResearch(task, controller.signal);
    } else if (strategy === 'multi_model') {
      await executeMultiModelPipeline(task, apiKey, controller.signal);
    } else {
      await executeStandard(task, apiKey, controller.signal);
    }
  } catch (error) {
    if (error instanceof PauseExecutionError) {
      // Task paused for human input - this is expected
      return;
    }
    if (controller.signal.aborted) {
      // Task was cancelled by user
      return;
    }
    // Actual error
    const message = error instanceof Error ? error.message : String(error);
    useTaskStore.getState().updateTask(taskId, { lastError: message });
    useTaskStore.getState().transitionTask(taskId, 'failed', 'agent', message);
  } finally {
    useExecutionStore.getState().markInactive(taskId);
    useExecutionStore.getState().clearStreamingContent(taskId);
    abortControllers.delete(taskId);
  }
}

async function executeStandard(
  task: LLMTask,
  apiKey: string,
  signal: AbortSignal,
): Promise<void> {
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(task) },
    { role: 'user', content: buildTaskPrompt(task) },
  ];

  // Add any previous conversation context
  const prevMessages = useConversationStore.getState().getMessages(task.conversationId);
  for (const msg of prevMessages) {
    if (msg.role === 'system') continue;
    messages.push({ role: msg.role as ChatMessage['role'], content: msg.content });
  }

  // If resuming after human input, add the latest human answer
  const latestInput = task.humanInputs[task.humanInputs.length - 1];
  if (latestInput && !prevMessages.some(m => m.content === latestInput.answer)) {
    messages.push({ role: 'user', content: latestInput.answer });
  }

  await runStreamingLoop(task, messages, apiKey, signal, true);
}

async function executePerplexityResearch(
  task: LLMTask,
  apiKey: string,
  signal: AbortSignal,
): Promise<void> {
  // Perplexity models have built-in web search, no tools needed
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a thorough research assistant. Provide comprehensive, well-sourced research reports.',
    },
    { role: 'user', content: buildResearchPrompt(task) },
  ];

  let fullContent = '';

  const stream = streamCompletion(messages, {
    apiKey,
    model: 'perplexity/sonar-deep-research',
    temperature: task.executionConfig.temperature,
    maxTokens: task.executionConfig.maxTokens,
    // No tools for Perplexity
  }, signal);

  for await (const chunk of stream) {
    if (chunk.type === 'content' && chunk.content) {
      fullContent += chunk.content;
      useExecutionStore.getState().appendStreamingContent(task.id, chunk.content);
    }
    if (chunk.type === 'done' && chunk.usage) {
      updateTokenUsage(task.id, chunk.usage, 'perplexity/sonar-deep-research');
    }
    if (chunk.type === 'error') {
      throw new Error(chunk.error);
    }
  }

  // Store result
  addConversationMessage(task.conversationId, 'assistant', fullContent);
  useTaskStore.getState().updateTask(task.id, {
    result: fullContent,
    resultSummary: fullContent.slice(0, 100) + '...',
    executionSteps: task.executionSteps + 1,
  });
  useTaskStore.getState().transitionTask(task.id, 'under_review', 'agent', 'Research complete');
}

async function executeOpenAIDeepResearch(
  task: LLMTask,
  signal: AbortSignal,
): Promise<void> {
  const settings = useSettingsStore.getState();
  const openAIKey = settings.openAIApiKey;
  if (!openAIKey) {
    throw new Error('OpenAI API key required for deep research. Configure it in Settings.');
  }

  // Use OpenAI's responses API directly
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAIKey}`,
    },
    body: JSON.stringify({
      model: 'o3-deep-research',
      input: buildResearchPrompt(task),
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  const result = data.output_text || data.choices?.[0]?.message?.content || '';

  addConversationMessage(task.conversationId, 'assistant', result);
  useTaskStore.getState().updateTask(task.id, {
    result,
    resultSummary: result.slice(0, 100) + '...',
    executionSteps: task.executionSteps + 1,
  });
  useTaskStore.getState().transitionTask(task.id, 'under_review', 'agent', 'Deep research complete');
}

async function executeMultiModelPipeline(
  task: LLMTask,
  apiKey: string,
  signal: AbortSignal,
): Promise<void> {
  // Step 1: Use Perplexity for web research
  useExecutionStore.getState().updateStreamingContent(
    task.id,
    '--- Step 1: Gathering research via Perplexity ---\n\n',
  );

  const researchMessages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a research assistant. Gather comprehensive information on the topic. Include sources.',
    },
    { role: 'user', content: buildResearchPrompt(task) },
  ];

  let researchContent = '';
  const researchStream = streamCompletion(researchMessages, {
    apiKey,
    model: 'perplexity/sonar-pro',
    temperature: 0.3,
    maxTokens: 4096,
  }, signal);

  for await (const chunk of researchStream) {
    if (chunk.type === 'content' && chunk.content) {
      researchContent += chunk.content;
      useExecutionStore.getState().appendStreamingContent(task.id, chunk.content);
    }
    if (chunk.type === 'done' && chunk.usage) {
      updateTokenUsage(task.id, chunk.usage, 'perplexity/sonar-pro');
    }
    if (chunk.type === 'error') throw new Error(chunk.error);
  }

  // Step 2: Use the user's chosen model for synthesis
  useExecutionStore.getState().appendStreamingContent(
    task.id,
    '\n\n--- Step 2: Synthesizing with ' + task.executionConfig.modelId + ' ---\n\n',
  );

  const synthesisMessages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert analyst. You have been given raw research data on a topic. Your job is to synthesize this into a clear, well-structured report.`,
    },
    {
      role: 'user',
      content: `Here is the research gathered on the topic "${task.title}":\n\n${researchContent}\n\nPlease synthesize this into a comprehensive, well-organized report. Include key findings, analysis, and conclusions.`,
    },
  ];

  let synthesisContent = '';
  const synthesisStream = streamCompletion(synthesisMessages, {
    apiKey,
    model: task.executionConfig.modelId,
    temperature: task.executionConfig.temperature,
    maxTokens: task.executionConfig.maxTokens,
  }, signal);

  for await (const chunk of synthesisStream) {
    if (chunk.type === 'content' && chunk.content) {
      synthesisContent += chunk.content;
      useExecutionStore.getState().appendStreamingContent(task.id, chunk.content);
    }
    if (chunk.type === 'done' && chunk.usage) {
      updateTokenUsage(task.id, chunk.usage, task.executionConfig.modelId);
    }
    if (chunk.type === 'error') throw new Error(chunk.error);
  }

  const fullResult = `## Research\n\n${researchContent}\n\n---\n\n## Synthesis\n\n${synthesisContent}`;

  addConversationMessage(task.conversationId, 'assistant', fullResult);
  useTaskStore.getState().updateTask(task.id, {
    result: fullResult,
    resultSummary: synthesisContent.slice(0, 100) + '...',
    executionSteps: task.executionSteps + 2,
  });
  useTaskStore.getState().transitionTask(task.id, 'under_review', 'agent', 'Multi-model research complete');
}

async function runStreamingLoop(
  task: LLMTask,
  messages: ChatMessage[],
  apiKey: string,
  signal: AbortSignal,
  useTools: boolean,
): Promise<void> {
  let fullContent = '';
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    iterations++;
    let iterContent = '';

    const stream = streamCompletion(messages, {
      apiKey,
      model: task.executionConfig.modelId,
      temperature: task.executionConfig.temperature,
      maxTokens: task.executionConfig.maxTokens,
      ...(useTools ? { tools: TOOL_DEFINITIONS } : {}),
    }, signal);

    const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];

    for await (const chunk of stream) {
      if (chunk.type === 'content' && chunk.content) {
        iterContent += chunk.content;
        fullContent += chunk.content;
        useExecutionStore.getState().appendStreamingContent(task.id, chunk.content);
      }
      if (chunk.type === 'tool_call' && chunk.toolCall) {
        toolCalls.push(chunk.toolCall);
      }
      if (chunk.type === 'done' && chunk.usage) {
        updateTokenUsage(task.id, chunk.usage, task.executionConfig.modelId);
      }
      if (chunk.type === 'error') {
        throw new Error(chunk.error);
      }
    }

    // If no tool calls, we're done
    if (toolCalls.length === 0) {
      addConversationMessage(task.conversationId, 'assistant', fullContent);
      useTaskStore.getState().updateTask(task.id, {
        result: fullContent,
        resultSummary: fullContent.slice(0, 100) + '...',
        executionSteps: task.executionSteps + iterations,
      });
      useTaskStore.getState().transitionTask(task.id, 'under_review', 'agent', 'Task complete');
      return;
    }

    // Process tool calls
    // Add assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: iterContent,
      tool_calls: toolCalls.map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.arguments },
      })),
    });

    for (const tc of toolCalls) {
      const result = await handleToolCall(tc, task);
      messages.push({
        role: 'tool',
        content: result,
        tool_call_id: tc.id,
      });
    }
  }

  // Max iterations reached
  addConversationMessage(task.conversationId, 'assistant', fullContent);
  useTaskStore.getState().updateTask(task.id, {
    result: fullContent,
    executionSteps: task.executionSteps + iterations,
  });
  useTaskStore.getState().transitionTask(task.id, 'under_review', 'agent', 'Max iterations reached');
}

async function handleToolCall(
  toolCall: { id: string; name: string; arguments: string },
  task: LLMTask,
): Promise<string> {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(toolCall.arguments);
  } catch {
    return 'Error: Invalid JSON arguments';
  }

  switch (toolCall.name) {
    case 'request_human_input': {
      const question = String(args.question || '');
      useTaskStore.getState().updateTask(task.id, { pendingQuestion: question });
      useTaskStore.getState().transitionTask(
        task.id, 'needs_input', 'agent', 'Needs human clarification',
      );
      addConversationMessage(task.conversationId, 'assistant', `[Asking user]: ${question}`);
      throw new PauseExecutionError('Waiting for human input');
    }

    case 'save_finding': {
      const finding: ResearchFinding = {
        id: crypto.randomUUID(),
        summary: String(args.summary || ''),
        detail: String(args.detail || ''),
        sources: Array.isArray(args.sources) ? args.sources.map(String) : [],
        confidence: (['low', 'medium', 'high'].includes(String(args.confidence))
          ? String(args.confidence)
          : 'medium') as ResearchFinding['confidence'],
        timestamp: new Date().toISOString(),
      };
      // Note: findings storage would be enhanced in Phase 4
      addConversationMessage(
        task.conversationId,
        'tool',
        `[Finding saved]: ${finding.summary}`,
      );
      return 'Finding saved successfully.';
    }

    case 'mark_complete': {
      const summary = String(args.summary || '');
      useTaskStore.getState().updateTask(task.id, { resultSummary: summary });
      return 'Task marked as complete.';
    }

    default:
      return `Unknown tool: ${toolCall.name}`;
  }
}

function addConversationMessage(
  conversationId: string,
  role: ConversationMessage['role'],
  content: string,
): void {
  useConversationStore.getState().addMessage(conversationId, {
    id: crypto.randomUUID(),
    conversationId,
    role,
    content,
    timestamp: new Date().toISOString(),
  });
}

function updateTokenUsage(
  taskId: string,
  usage: { prompt_tokens: number; completion_tokens: number },
  modelId: string,
): void {
  const task = useTaskStore.getState().getTask(taskId);
  if (!task) return;

  const cost = estimateCost(usage.prompt_tokens, usage.completion_tokens, modelId);

  useTaskStore.getState().updateTask(taskId, {
    tokenUsage: {
      promptTokens: task.tokenUsage.promptTokens + usage.prompt_tokens,
      completionTokens: task.tokenUsage.completionTokens + usage.completion_tokens,
      totalCost: task.tokenUsage.totalCost + cost,
    },
  });

  useSettingsStore.getState().addToSpent(cost);
}

export function cancelExecution(taskId: string): void {
  const controller = abortControllers.get(taskId);
  if (controller) {
    controller.abort();
    abortControllers.delete(taskId);
  }
  useExecutionStore.getState().markInactive(taskId);
  useExecutionStore.getState().clearStreamingContent(taskId);
}
