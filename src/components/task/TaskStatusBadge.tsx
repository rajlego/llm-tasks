import type { TaskStatus } from '../../models/task';
import { STATUS_LABELS, STATUS_COLORS } from '../../models/task';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'xs' | 'sm' | 'md';
}

export function TaskStatusBadge({ status, size = 'xs' }: TaskStatusBadgeProps) {
  return (
    <span className={`badge badge-${size} ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
