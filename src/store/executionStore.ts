import { create } from 'zustand';

interface ExecutionState {
  // Active executions: taskId -> true (AbortControllers stored in executor service)
  activeTaskIds: Set<string>;

  // Streaming content per task
  streamingContent: Record<string, string>;

  // Actions
  markActive: (taskId: string) => void;
  markInactive: (taskId: string) => void;
  isExecuting: (taskId: string) => boolean;
  getActiveCount: () => number;

  // Streaming
  updateStreamingContent: (taskId: string, content: string) => void;
  appendStreamingContent: (taskId: string, chunk: string) => void;
  clearStreamingContent: (taskId: string) => void;
  getStreamingContent: (taskId: string) => string;
}

export const useExecutionStore = create<ExecutionState>()((set, get) => ({
  activeTaskIds: new Set(),
  streamingContent: {},

  markActive: (taskId) => {
    set(state => {
      const next = new Set(state.activeTaskIds);
      next.add(taskId);
      return { activeTaskIds: next };
    });
  },

  markInactive: (taskId) => {
    set(state => {
      const next = new Set(state.activeTaskIds);
      next.delete(taskId);
      return { activeTaskIds: next };
    });
  },

  isExecuting: (taskId) => get().activeTaskIds.has(taskId),

  getActiveCount: () => get().activeTaskIds.size,

  updateStreamingContent: (taskId, content) => {
    set(state => ({
      streamingContent: { ...state.streamingContent, [taskId]: content },
    }));
  },

  appendStreamingContent: (taskId, chunk) => {
    set(state => ({
      streamingContent: {
        ...state.streamingContent,
        [taskId]: (state.streamingContent[taskId] || '') + chunk,
      },
    }));
  },

  clearStreamingContent: (taskId) => {
    set(state => {
      const { [taskId]: _, ...rest } = state.streamingContent;
      return { streamingContent: rest };
    });
  },

  getStreamingContent: (taskId) => get().streamingContent[taskId] || '',
}));
