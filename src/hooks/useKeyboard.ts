import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useTaskStore } from '../store/taskStore';
import { BOARD_COLUMNS } from '../models/task';

export function useKeyboard() {
  const setView = useUIStore(s => s.setView);
  const setQuickAddOpen = useUIStore(s => s.setQuickAddOpen);
  const closeDetail = useUIStore(s => s.closeDetail);
  const detailPanelOpen = useUIStore(s => s.detailPanelOpen);
  const currentView = useUIStore(s => s.currentView);
  const focusedColumnIndex = useUIStore(s => s.focusedColumnIndex);
  const focusedTaskIndex = useUIStore(s => s.focusedTaskIndex);
  const setFocusedColumn = useUIStore(s => s.setFocusedColumn);
  const setFocusedTask = useUIStore(s => s.setFocusedTask);
  const openDetail = useUIStore(s => s.openDetail);
  const setShowKeyboardHints = useUIStore(s => s.setShowKeyboardHints);
  const tasks = useTaskStore(s => s.tasks);
  const transitionTask = useTaskStore(s => s.transitionTask);
  const selectedTaskId = useUIStore(s => s.selectedTaskId);

  useEffect(() => {
    function isEditing() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select';
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Alt key shows keyboard hints
      if (e.key === 'Alt') {
        setShowKeyboardHints(true);
        return;
      }

      // Skip shortcuts when editing text
      if (isEditing()) return;

      // Global shortcuts
      switch (e.key) {
        case '1':
          setView('board');
          return;
        case '2':
          setView('list');
          return;
        case '3':
          setView('settings');
          return;
        case 'n':
          e.preventDefault();
          setQuickAddOpen(true);
          return;
        case '/':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
          return;
        case 'Escape':
          if (detailPanelOpen) {
            closeDetail();
          } else {
            useUIStore.getState().setSearchQuery('');
          }
          return;
      }

      // Board navigation
      if (currentView === 'board') {
        const columnTasks = tasks.filter(
          t => t.status === BOARD_COLUMNS[focusedColumnIndex],
        );

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            setFocusedColumn(Math.max(0, focusedColumnIndex - 1));
            return;
          case 'ArrowRight':
            e.preventDefault();
            setFocusedColumn(Math.min(BOARD_COLUMNS.length - 1, focusedColumnIndex + 1));
            return;
          case 'ArrowUp':
            e.preventDefault();
            setFocusedTask(Math.max(0, focusedTaskIndex - 1));
            return;
          case 'ArrowDown':
            e.preventDefault();
            setFocusedTask(Math.min(columnTasks.length - 1, focusedTaskIndex + 1));
            return;
          case 'Enter': {
            const focusedTask = columnTasks[focusedTaskIndex];
            if (focusedTask) openDetail(focusedTask.id);
            return;
          }
        }
      }

      // Task actions (when detail panel is open)
      if (detailPanelOpen && selectedTaskId) {
        const task = tasks.find(t => t.id === selectedTaskId);
        if (!task) return;

        switch (e.key) {
          case 'r':
            if (task.status === 'queued' || task.status === 'failed') {
              transitionTask(task.id, task.status === 'failed' ? 'queued' : 'in_progress', 'user');
            }
            return;
          case 'a':
            if (task.status === 'under_review') {
              transitionTask(task.id, 'approved', 'user');
            }
            return;
          case 'x':
            if (task.status === 'done' || task.status === 'approved') {
              transitionTask(task.id, 'archived', 'user');
            }
            return;
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'Alt') {
        setShowKeyboardHints(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    setView, setQuickAddOpen, closeDetail, detailPanelOpen, currentView,
    focusedColumnIndex, focusedTaskIndex, setFocusedColumn, setFocusedTask,
    openDetail, setShowKeyboardHints, tasks, transitionTask, selectedTaskId,
  ]);
}
