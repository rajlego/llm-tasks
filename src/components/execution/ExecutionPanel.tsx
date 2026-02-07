import { useExecutionStore } from '../../store/executionStore';
import { StreamingMessage } from './StreamingMessage';

interface ExecutionPanelProps {
  taskId: string;
}

export function ExecutionPanel({ taskId }: ExecutionPanelProps) {
  const isExecuting = useExecutionStore(s => s.isExecuting(taskId));
  const streamingContent = useExecutionStore(s => s.getStreamingContent(taskId));

  if (!isExecuting && !streamingContent) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Execution</h3>
        {isExecuting && (
          <span className="loading loading-spinner loading-xs text-info" />
        )}
      </div>
      {streamingContent && <StreamingMessage content={streamingContent} />}
    </div>
  );
}
