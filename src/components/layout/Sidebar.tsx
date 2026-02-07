import { useUIStore, type ViewMode } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { useExecutionStore } from '../../store/executionStore';
import { BOARD_COLUMNS, STATUS_LABELS } from '../../models/task';

const NAV_ITEMS: { view: ViewMode; label: string; key: string }[] = [
  { view: 'board', label: 'Board', key: '1' },
  { view: 'list', label: 'List', key: '2' },
  { view: 'settings', label: 'Settings', key: '3' },
];

export function Sidebar() {
  const currentView = useUIStore(s => s.currentView);
  const setView = useUIStore(s => s.setView);
  const tasks = useTaskStore(s => s.tasks);
  const activeCount = useExecutionStore(s => s.getActiveCount());

  const statusCounts = BOARD_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = tasks.filter(t => t.status === status).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const needsAttention =
    statusCounts['needs_input'] + statusCounts['under_review'];

  return (
    <aside className="w-56 bg-base-200 flex flex-col h-full border-r border-base-300">
      <div className="p-4">
        <h1 className="text-lg font-bold">LLM Tasks</h1>
      </div>

      <nav className="flex-1 px-2">
        <ul className="menu menu-sm">
          {NAV_ITEMS.map(item => (
            <li key={item.view}>
              <button
                className={currentView === item.view ? 'active' : ''}
                onClick={() => setView(item.view)}
              >
                <span>{item.label}</span>
                <kbd className="kbd kbd-xs ml-auto">{item.key}</kbd>
              </button>
            </li>
          ))}
        </ul>

        <div className="divider my-2 text-xs text-base-content/40">Status</div>

        <ul className="menu menu-xs">
          {BOARD_COLUMNS.map(status => (
            <li key={status}>
              <span className="flex justify-between">
                <span>{STATUS_LABELS[status]}</span>
                <span className="badge badge-xs badge-ghost">
                  {statusCounts[status] || 0}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-base-300 text-xs text-base-content/50">
        {activeCount > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <span className="loading loading-spinner loading-xs text-info" />
            <span>{activeCount} running</span>
          </div>
        )}
        {needsAttention > 0 && (
          <div className="flex items-center gap-2">
            <span className="badge badge-xs badge-warning" />
            <span>{needsAttention} need attention</span>
          </div>
        )}
      </div>
    </aside>
  );
}
