import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTaskStore } from '../../store/taskStore';
import { useExecutionStore } from '../../store/executionStore';
import { TaskQuickAdd } from '../task/TaskQuickAdd';
import { executeTask } from '../../services/llm/executor';
import { formatCost } from '../../utils/date';

export function TopBar() {
  const searchQuery = useUIStore(s => s.searchQuery);
  const setSearchQuery = useUIStore(s => s.setSearchQuery);
  const quickAddOpen = useUIStore(s => s.quickAddOpen);
  const setQuickAddOpen = useUIStore(s => s.setQuickAddOpen);
  const totalSpent = useSettingsStore(s => s.totalSpent);
  const hasApiKey = useSettingsStore(s => s.openRouterApiKey.length > 0);
  const queuedTasks = useTaskStore(s => s.tasks.filter(t => t.status === 'queued'));
  const activeCount = useExecutionStore(s => s.getActiveCount());

  const runAllQueued = () => {
    for (const task of queuedTasks) {
      executeTask(task.id);
    }
  };

  return (
    <header className="h-12 flex items-center gap-3 px-4 border-b border-base-300 bg-base-100">
      {quickAddOpen ? (
        <TaskQuickAdd />
      ) : (
        <>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setQuickAddOpen(true)}
          >
            + New Task
            <kbd className="kbd kbd-xs">n</kbd>
          </button>

          {queuedTasks.length > 0 && hasApiKey && (
            <button
              className="btn btn-sm btn-info btn-outline"
              onClick={runAllQueued}
            >
              Run All ({queuedTasks.length})
            </button>
          )}

          <input
            type="text"
            className="input input-sm input-bordered w-64"
            placeholder="Search tasks... (/)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div className="flex-1" />

          {activeCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-info">
              <span className="loading loading-spinner loading-xs" />
              <span>{activeCount} running</span>
            </div>
          )}

          {totalSpent > 0 && (
            <span className="text-xs text-base-content/50">
              {formatCost(totalSpent)}
            </span>
          )}

          {!hasApiKey && (
            <span className="badge badge-sm badge-warning">No API key</span>
          )}
        </>
      )}
    </header>
  );
}
