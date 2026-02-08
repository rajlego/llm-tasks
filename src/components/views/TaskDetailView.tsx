import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { useConversationStore } from '../../store/conversationStore';
import { useExecutionStore } from '../../store/executionStore';
import { TaskStatusBadge } from '../task/TaskStatusBadge';
import { ConversationThread } from '../execution/ConversationThread';
import { HumanInputForm } from '../execution/HumanInputForm';
import { StreamingMessage } from '../execution/StreamingMessage';
import { MODEL_REGISTRY } from '../../models/agent';
import { STATUS_LABELS, VALID_TRANSITIONS, type TaskStatus } from '../../models/task';
import { formatRelativeTime, formatCost } from '../../utils/date';
import { executeTask, cancelExecution } from '../../services/llm/executor';
import { useSettingsStore } from '../../store/settingsStore';

export function TaskDetailView() {
  const selectedTaskId = useUIStore(s => s.selectedTaskId);
  const detailPanelOpen = useUIStore(s => s.detailPanelOpen);
  const closeDetail = useUIStore(s => s.closeDetail);
  const task = useTaskStore(s => s.tasks.find(t => t.id === selectedTaskId));
  const transitionTask = useTaskStore(s => s.transitionTask);
  const updateTask = useTaskStore(s => s.updateTask);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const messages = useConversationStore(s =>
    task ? s.getMessages(task.conversationId) : [],
  );
  const isExecuting = useExecutionStore(s =>
    selectedTaskId ? s.isExecuting(selectedTaskId) : false,
  );
  const streamingContent = useExecutionStore(s =>
    selectedTaskId ? s.getStreamingContent(selectedTaskId) : '',
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  if (!detailPanelOpen || !task) return null;

  const validTransitions = VALID_TRANSITIONS[task.status];

  const startEditing = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setIsEditing(true);
  };

  const saveEditing = () => {
    updateTask(task.id, { title: editTitle, description: editDescription });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTask(task.id);
    closeDetail();
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-base-100 border-l border-base-300 shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-base-300">
        <TaskStatusBadge status={task.status} size="sm" />
        {isExecuting && (
          <span className="loading loading-spinner loading-sm text-info" />
        )}
        <div className="flex-1" />
        <button className="btn btn-ghost btn-xs" onClick={closeDetail}>
          Esc
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title & Description */}
        {isEditing ? (
          <div className="space-y-2">
            <input
              className="input input-sm input-bordered w-full"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEditing();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              autoFocus
            />
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              rows={3}
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="Task description..."
            />
            <div className="flex gap-2">
              <button className="btn btn-xs btn-primary" onClick={saveEditing}>Save</button>
              <button className="btn btn-xs btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="cursor-pointer" onClick={startEditing}>
            <h2 className="text-lg font-semibold">{task.title}</h2>
            {task.description && (
              <p className="text-sm text-base-content/70 mt-1">{task.description}</p>
            )}
            <p className="text-xs text-base-content/40 mt-1">Click to edit</p>
          </div>
        )}

        {/* Config (editable when queued) */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="form-control">
              <span className="label-text text-xs">Model</span>
              <select
                className="select select-xs select-bordered"
                value={task.executionConfig.modelId}
                onChange={e => updateTask(task.id, {
                  executionConfig: { ...task.executionConfig, modelId: e.target.value },
                })}
                disabled={task.status !== 'queued'}
              >
                {MODEL_REGISTRY.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-xs">Strategy</span>
              <select
                className="select select-xs select-bordered"
                value={task.executionConfig.researchStrategy}
                onChange={e => updateTask(task.id, {
                  executionConfig: {
                    ...task.executionConfig,
                    researchStrategy: e.target.value as import('../../models/task').ResearchStrategy,
                  },
                })}
                disabled={task.status !== 'queued'}
              >
                <option value="standard">Standard</option>
                <option value="perplexity">Perplexity Research</option>
                <option value="openai_deep">OpenAI Deep Research</option>
                <option value="multi_model">Multi-Model Pipeline</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-base-content/60">
            <div>Created: {formatRelativeTime(task.createdAt)}</div>
            <div>Cost: {formatCost(task.tokenUsage.totalCost)}</div>
            <div>Steps: {task.executionSteps}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Run / Cancel button */}
          {task.status === 'queued' && (
            <button
              className="btn btn-xs btn-info"
              onClick={() => {
                if (!useSettingsStore.getState().hasApiKey()) {
                  useUIStore.getState().setView('settings');
                  return;
                }
                executeTask(task.id);
              }}
            >
              Run
            </button>
          )}
          {isExecuting && (
            <button
              className="btn btn-xs btn-error"
              onClick={() => cancelExecution(task.id)}
            >
              Cancel
            </button>
          )}
          {task.status === 'failed' && (
            <button
              className="btn btn-xs btn-info"
              onClick={() => {
                transitionTask(task.id, 'queued', 'user', 'Retry');
                setTimeout(() => executeTask(task.id), 100);
              }}
            >
              Retry
            </button>
          )}

          {validTransitions
            .filter(s => !(task.status === 'queued' && s === 'in_progress')) // already have Run
            .filter(s => !(task.status === 'failed' && s === 'queued')) // already have Retry
            .map(targetStatus => (
              <button
                key={targetStatus}
                className={`btn btn-xs ${getActionStyle(targetStatus)}`}
                onClick={() => transitionTask(task.id, targetStatus, 'user')}
              >
                {getActionLabel(task.status, targetStatus)}
              </button>
            ))}
          <button className="btn btn-xs btn-error btn-outline" onClick={handleDelete}>
            Delete
          </button>
        </div>

        {/* Human Input Form (when needs_input) */}
        {task.status === 'needs_input' && task.pendingQuestion && (
          <HumanInputForm task={task} />
        )}

        {/* Streaming Output */}
        {isExecuting && streamingContent && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Live Output</h3>
            <StreamingMessage content={streamingContent} />
          </div>
        )}

        {/* Result */}
        {task.result && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Result</h3>
            <div className="prose prose-sm max-w-none bg-base-200 p-3 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{task.result}</pre>
            </div>
          </div>
        )}

        {/* Error */}
        {task.lastError && (
          <div className="alert alert-error text-sm">
            <span>{task.lastError}</span>
          </div>
        )}

        {/* Conversation Thread */}
        {messages.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">
              Conversation ({messages.length} messages)
            </h3>
            <ConversationThread messages={messages} />
          </div>
        )}
      </div>
    </div>
  );
}

function getActionLabel(from: TaskStatus, to: TaskStatus): string {
  const labels: Record<string, string> = {
    'queued->in_progress': 'Run',
    'queued->archived': 'Archive',
    'in_progress->needs_input': 'Pause (needs input)',
    'in_progress->under_review': 'Submit for Review',
    'in_progress->failed': 'Mark Failed',
    'in_progress->queued': 'Pause',
    'needs_input->in_progress': 'Resume',
    'under_review->approved': 'Approve',
    'under_review->in_progress': 'Reject (needs work)',
    'under_review->needs_input': 'Ask Question',
    'approved->done': 'Mark Done',
    'approved->archived': 'Archive',
    'done->archived': 'Archive',
    'failed->queued': 'Retry',
  };
  return labels[`${from}->${to}`] || STATUS_LABELS[to];
}

function getActionStyle(targetStatus: TaskStatus): string {
  const styles: Record<TaskStatus, string> = {
    in_progress: 'btn-info',
    needs_input: 'btn-warning',
    under_review: 'btn-accent',
    approved: 'btn-success',
    done: 'btn-success',
    archived: 'btn-ghost',
    failed: 'btn-error',
    queued: 'btn-ghost',
  };
  return styles[targetStatus] || '';
}
