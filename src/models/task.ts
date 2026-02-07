export type TaskStatus =
  | 'queued'
  | 'in_progress'
  | 'needs_input'
  | 'under_review'
  | 'approved'
  | 'done'
  | 'archived'
  | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReviewDepth = 'light' | 'standard' | 'deep';

export type ResearchStrategy = 'standard' | 'perplexity' | 'openai_deep' | 'multi_model';

export interface TaskExecutionConfig {
  modelId: string;
  temperature: number;
  maxTokens: number;
  researchStrategy: ResearchStrategy;
}

export interface StatusTransition {
  from: TaskStatus;
  to: TaskStatus;
  timestamp: string;
  triggeredBy: 'user' | 'agent';
  reason?: string;
}

export interface HumanInput {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

export interface LLMTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  reviewDepth: ReviewDepth;
  tags: string[];

  executionConfig: TaskExecutionConfig;

  conversationId: string;
  result?: string;
  resultSummary?: string;
  pendingQuestion?: string;
  humanInputs: HumanInput[];

  statusHistory: StatusTransition[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
  executionSteps: number;
  lastError?: string;
  retryCount: number;

  createdAt: string;
  modifiedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export const DEFAULT_EXECUTION_CONFIG: TaskExecutionConfig = {
  modelId: 'anthropic/claude-sonnet-4',
  temperature: 0.7,
  maxTokens: 4096,
  researchStrategy: 'standard',
};

const RESEARCH_KEYWORDS = [
  'research', 'investigate', 'find out', 'compare', 'analyze',
  'look into', 'study', 'explore', 'review', 'examine',
  'what is', 'how does', 'how well', 'how effective',
];

export function detectResearchStrategy(description: string): ResearchStrategy {
  const lower = description.toLowerCase();
  const isResearch = RESEARCH_KEYWORDS.some(kw => lower.includes(kw));
  return isResearch ? 'perplexity' : 'standard';
}

export function createTask(
  title: string,
  description: string = '',
  configOverrides?: Partial<TaskExecutionConfig>,
): LLMTask {
  const now = new Date().toISOString();
  const strategy = detectResearchStrategy(title + ' ' + description);

  return {
    id: crypto.randomUUID(),
    title,
    description,
    status: 'queued',
    priority: 'medium',
    reviewDepth: 'standard',
    tags: [],
    executionConfig: {
      ...DEFAULT_EXECUTION_CONFIG,
      researchStrategy: strategy,
      ...configOverrides,
    },
    conversationId: crypto.randomUUID(),
    humanInputs: [],
    statusHistory: [{
      from: 'queued',
      to: 'queued',
      timestamp: now,
      triggeredBy: 'user',
    }],
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalCost: 0,
    },
    executionSteps: 0,
    retryCount: 0,
    createdAt: now,
    modifiedAt: now,
  };
}

// Valid state transitions
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  queued: ['in_progress', 'failed', 'archived'],
  in_progress: ['needs_input', 'under_review', 'failed', 'queued'],
  needs_input: ['in_progress'],
  under_review: ['approved', 'in_progress', 'needs_input'],
  approved: ['done', 'archived'],
  done: ['archived'],
  archived: [],
  failed: ['queued'],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  queued: 'Queued',
  in_progress: 'In Progress',
  needs_input: 'Needs Input',
  under_review: 'Under Review',
  approved: 'Approved',
  done: 'Done',
  archived: 'Archived',
  failed: 'Failed',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  queued: 'badge-ghost',
  in_progress: 'badge-info',
  needs_input: 'badge-warning',
  under_review: 'badge-accent',
  approved: 'badge-success',
  done: 'badge-success',
  archived: 'badge-neutral',
  failed: 'badge-error',
};

// Columns shown on the board (not archived)
export const BOARD_COLUMNS: TaskStatus[] = [
  'queued',
  'in_progress',
  'needs_input',
  'under_review',
  'approved',
  'done',
];
