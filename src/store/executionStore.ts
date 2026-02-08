import { create } from 'zustand';

interface ExecutionState {
  // Active executions: taskId -> true
  activeTaskIds: Record<string, boolean>;

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
  activeTaskIds: {},
  streamingContent: {},

  markActive: (taskId) => {
    set(state => ({
      activeTaskIds: { ...state.activeTaskIds, [taskId]: true },
    }));
  },

  markInactive: (taskId) => {
    set(state => {
      const { [taskId]: _, ...rest } = state.activeTaskIds;
      return { activeTaskIds: rest };
    });
  },

  isExecuting: (taskId) => Boolean(get().activeTaskIds[taskId]),

  getActiveCount: () => Object.keys(get().activeTaskIds).length,

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
