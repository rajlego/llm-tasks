import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMTask, TaskStatus, TaskExecutionConfig } from '../models/task';
import { createTask, canTransition } from '../models/task';

interface TaskState {
  tasks: LLMTask[];

  // CRUD
  addTask: (title: string, description?: string, config?: Partial<TaskExecutionConfig>) => LLMTask;
  updateTask: (id: string, updates: Partial<LLMTask>) => void;
  deleteTask: (id: string) => void;

  // State transitions
  transitionTask: (
    id: string,
    newStatus: TaskStatus,
    triggeredBy: 'user' | 'agent',
    reason?: string,
  ) => boolean;

  // Queries
  getTask: (id: string) => LLMTask | undefined;
  getTasksByStatus: (status: TaskStatus) => LLMTask[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (title, description = '', config) => {
        const task = createTask(title, description, config);
        set(state => ({ tasks: [...state.tasks, task] }));
        return task;
      },

      updateTask: (id, updates) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === id
              ? { ...t, ...updates, modifiedAt: new Date().toISOString() }
              : t,
          ),
        }));
      },

      deleteTask: (id) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
        }));
      },

      transitionTask: (id, newStatus, triggeredBy, reason) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return false;
        if (!canTransition(task.status, newStatus)) return false;

        const now = new Date().toISOString();
        const transition = {
          from: task.status,
          to: newStatus,
          timestamp: now,
          triggeredBy,
          reason,
        };

        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === id
              ? {
                  ...t,
                  status: newStatus,
                  statusHistory: [...t.statusHistory, transition],
                  modifiedAt: now,
                  ...(newStatus === 'in_progress' && !t.startedAt ? { startedAt: now } : {}),
                  ...(newStatus === 'done' || newStatus === 'approved' ? { completedAt: now } : {}),
                }
              : t,
          ),
        }));
        return true;
      },

      getTask: (id) => get().tasks.find(t => t.id === id),

      getTasksByStatus: (status) => get().tasks.filter(t => t.status === status),
    }),
    {
      name: 'llm-tasks-store',
    },
  ),
);
