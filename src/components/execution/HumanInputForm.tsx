import { useState } from 'react';
import type { LLMTask } from '../../models/task';
import { useTaskStore } from '../../store/taskStore';

interface HumanInputFormProps {
  task: LLMTask;
}

export function HumanInputForm({ task }: HumanInputFormProps) {
  const [answer, setAnswer] = useState('');
  const updateTask = useTaskStore(s => s.updateTask);
  const transitionTask = useTaskStore(s => s.transitionTask);

  const handleSubmit = () => {
    const trimmed = answer.trim();
    if (!trimmed) return;

    const input = {
      id: crypto.randomUUID(),
      question: task.pendingQuestion || '',
      answer: trimmed,
      timestamp: new Date().toISOString(),
    };

    updateTask(task.id, {
      humanInputs: [...task.humanInputs, input],
      pendingQuestion: undefined,
    });
    transitionTask(task.id, 'in_progress', 'user', 'Human provided input');
    setAnswer('');
  };

  return (
    <div className="card bg-warning/10 border border-warning/30">
      <div className="card-body p-3 gap-2">
        <h4 className="text-sm font-semibold text-warning">Input Needed</h4>
        <p className="text-sm">{task.pendingQuestion}</p>
        <textarea
          className="textarea textarea-bordered w-full text-sm"
          rows={3}
          placeholder="Type your answer..."
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-base-content/40">Cmd+Enter to submit</span>
          <button
            className="btn btn-sm btn-warning"
            onClick={handleSubmit}
            disabled={!answer.trim()}
          >
            Submit Answer
          </button>
        </div>
      </div>
    </div>
  );
}
