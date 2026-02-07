import { create } from 'zustand';
import type { TaskStatus } from '../models/task';

export type ViewMode = 'board' | 'list' | 'settings';

interface UIState {
  currentView: ViewMode;
  selectedTaskId: string | null;
  detailPanelOpen: boolean;

  // Board navigation
  focusedColumnIndex: number;
  focusedTaskIndex: number;

  // Search/filter
  searchQuery: string;
  activeTagFilter: string | null;
  statusFilter: TaskStatus | null;

  // Keyboard hints
  showKeyboardHints: boolean;

  // Quick add
  quickAddOpen: boolean;

  // Actions
  setView: (view: ViewMode) => void;
  selectTask: (id: string | null) => void;
  openDetail: (taskId: string) => void;
  closeDetail: () => void;
  setFocusedColumn: (index: number) => void;
  setFocusedTask: (index: number) => void;
  setSearchQuery: (query: string) => void;
  setTagFilter: (tag: string | null) => void;
  setStatusFilter: (status: TaskStatus | null) => void;
  setShowKeyboardHints: (show: boolean) => void;
  setQuickAddOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  currentView: 'board',
  selectedTaskId: null,
  detailPanelOpen: false,
  focusedColumnIndex: 0,
  focusedTaskIndex: 0,
  searchQuery: '',
  activeTagFilter: null,
  statusFilter: null,
  showKeyboardHints: false,
  quickAddOpen: false,

  setView: (view) => set({ currentView: view }),
  selectTask: (id) => set({ selectedTaskId: id }),
  openDetail: (taskId) => set({ selectedTaskId: taskId, detailPanelOpen: true }),
  closeDetail: () => set({ detailPanelOpen: false }),
  setFocusedColumn: (index) => set({ focusedColumnIndex: index, focusedTaskIndex: 0 }),
  setFocusedTask: (index) => set({ focusedTaskIndex: index }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTagFilter: (tag) => set({ activeTagFilter: tag }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setShowKeyboardHints: (show) => set({ showKeyboardHints: show }),
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
}));
