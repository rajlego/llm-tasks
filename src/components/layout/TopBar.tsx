import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { TaskQuickAdd } from '../task/TaskQuickAdd';
import { formatCost } from '../../utils/date';

export function TopBar() {
  const searchQuery = useUIStore(s => s.searchQuery);
  const setSearchQuery = useUIStore(s => s.setSearchQuery);
  const quickAddOpen = useUIStore(s => s.quickAddOpen);
  const setQuickAddOpen = useUIStore(s => s.setQuickAddOpen);
  const totalSpent = useSettingsStore(s => s.totalSpent);

  return (
    <header className="h-12 flex items-center gap-3 px-4 border-b border-base-300 bg-base-100">
      {quickAddOpen ? (
        <div className="flex-1">
          <TaskQuickAdd />
        </div>
      ) : (
        <>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setQuickAddOpen(true)}
          >
            + New Task
            <kbd className="kbd kbd-xs">n</kbd>
          </button>

          <input
            type="text"
            className="input input-sm input-bordered w-64"
            placeholder="Search tasks... (/)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div className="flex-1" />

          {totalSpent > 0 && (
            <span className="text-xs text-base-content/50">
              Spent: {formatCost(totalSpent)}
            </span>
          )}
        </>
      )}
    </header>
  );
}
