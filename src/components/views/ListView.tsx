import { useMemo } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { TaskCard } from '../task/TaskCard';
import { EmptyState } from '../common/EmptyState';

export function ListView() {
  const tasks = useTaskStore(s => s.tasks);
  const searchQuery = useUIStore(s => s.searchQuery);
  const statusFilter = useUIStore(s => s.statusFilter);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return tasks
      .filter(t => t.status !== 'archived')
      .filter(t => !statusFilter || t.status === statusFilter)
      .filter(t =>
        !query ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query),
      )
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
  }, [tasks, searchQuery, statusFilter]);

  if (filteredTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          title="No tasks found"
          description="Press 'n' to create a new task"
        />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-2">
      {filteredTasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
