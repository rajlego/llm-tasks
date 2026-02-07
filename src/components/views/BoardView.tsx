import { useMemo } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { TaskCard } from '../task/TaskCard';
import { EmptyState } from '../common/EmptyState';
import { BOARD_COLUMNS, STATUS_LABELS, type TaskStatus } from '../../models/task';

export function BoardView() {
  const tasks = useTaskStore(s => s.tasks);
  const searchQuery = useUIStore(s => s.searchQuery);
  const focusedColumnIndex = useUIStore(s => s.focusedColumnIndex);
  const focusedTaskIndex = useUIStore(s => s.focusedTaskIndex);

  const columns = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return BOARD_COLUMNS.map(status => ({
      status,
      tasks: tasks
        .filter(t => t.status === status)
        .filter(t =>
          !query ||
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some(tag => tag.toLowerCase().includes(query)),
        )
        .sort((a, b) => {
          // Priority sort within column
          const priority = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priority[a.priority] - priority[b.priority];
        }),
    }));
  }, [tasks, searchQuery]);

  return (
    <div className="flex gap-3 p-4 h-full overflow-x-auto">
      {columns.map((col, colIdx) => (
        <Column
          key={col.status}
          status={col.status}
          tasks={col.tasks}
          focused={colIdx === focusedColumnIndex}
          focusedTaskIndex={colIdx === focusedColumnIndex ? focusedTaskIndex : -1}
        />
      ))}
    </div>
  );
}

interface ColumnProps {
  status: TaskStatus;
  tasks: import('../../models/task').LLMTask[];
  focused: boolean;
  focusedTaskIndex: number;
}

function Column({ status, tasks, focused, focusedTaskIndex }: ColumnProps) {
  return (
    <div
      className={`flex flex-col w-64 min-w-64 rounded-lg bg-base-200/50 ${
        focused ? 'ring-1 ring-primary/30' : ''
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold">{STATUS_LABELS[status]}</h2>
        <span className="badge badge-xs badge-ghost">{tasks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
        {tasks.length === 0 ? (
          <EmptyState title="No tasks" />
        ) : (
          tasks.map((task, taskIdx) => (
            <TaskCard
              key={task.id}
              task={task}
              focused={focused && taskIdx === focusedTaskIndex}
            />
          ))
        )}
      </div>
    </div>
  );
}
