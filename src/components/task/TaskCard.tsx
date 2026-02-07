import type { LLMTask } from '../../models/task';
import { TaskStatusBadge } from './TaskStatusBadge';
import { useUIStore } from '../../store/uiStore';
import { useExecutionStore } from '../../store/executionStore';
import { formatRelativeTime, formatCost } from '../../utils/date';
import { getModelInfo } from '../../models/agent';

interface TaskCardProps {
  task: LLMTask;
  focused?: boolean;
}

export function TaskCard({ task, focused }: TaskCardProps) {
  const openDetail = useUIStore(s => s.openDetail);
  const isExecuting = useExecutionStore(s => s.isExecuting(task.id));
  const model = getModelInfo(task.executionConfig.modelId);

  return (
    <div
      className={`card card-compact bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow border ${
        focused ? 'border-primary ring-1 ring-primary' : 'border-base-300'
      }`}
      onClick={() => openDetail(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openDetail(task.id);
      }}
    >
      <div className="card-body gap-1 p-3">
        <div className="flex items-center gap-2">
          <TaskStatusBadge status={task.status} />
          {isExecuting && (
            <span className="loading loading-spinner loading-xs text-info" />
          )}
        </div>

        <h3 className="text-sm font-medium leading-tight line-clamp-2">
          {task.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-base-content/50 mt-1">
          {model && <span>{model.name}</span>}
          {task.tokenUsage.totalCost > 0 && (
            <span>{formatCost(task.tokenUsage.totalCost)}</span>
          )}
          <span className="ml-auto">{formatRelativeTime(task.createdAt)}</span>
        </div>

        {task.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {task.tags.map(tag => (
              <span key={tag} className="badge badge-xs badge-outline">{tag}</span>
            ))}
          </div>
        )}

        {task.status === 'needs_input' && task.pendingQuestion && (
          <div className="text-xs text-warning mt-1 line-clamp-1">
            {task.pendingQuestion}
          </div>
        )}
      </div>
    </div>
  );
}
