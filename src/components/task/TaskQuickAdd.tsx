import { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { executeTask } from '../../services/llm/executor';
import type { ResearchStrategy } from '../../models/task';

export function TaskQuickAdd() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [strategy, setStrategy] = useState<ResearchStrategy>('standard');
  const [autoRun, setAutoRun] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTask = useTaskStore(s => s.addTask);
  const quickAddOpen = useUIStore(s => s.quickAddOpen);
  const setQuickAddOpen = useUIStore(s => s.setQuickAddOpen);
  const hasApiKey = useSettingsStore(s => s.hasApiKey());

  useEffect(() => {
    if (quickAddOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [quickAddOpen]);

  // Auto-detect research strategy from title
  useEffect(() => {
    const lower = title.toLowerCase();
    const researchKeywords = ['research', 'investigate', 'find out', 'compare', 'analyze', 'look into', 'how well', 'how effective'];
    const isResearch = researchKeywords.some(kw => lower.includes(kw));
    setStrategy(isResearch ? 'perplexity' : 'standard');
  }, [title]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task = addTask(trimmed, description.trim(), { researchStrategy: strategy });
    setTitle('');
    setDescription('');
    setShowDescription(false);
    setQuickAddOpen(false);
    if (autoRun && hasApiKey) {
      executeTask(task.id);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setShowDescription(false);
    setQuickAddOpen(false);
  };

  if (!quickAddOpen) return null;

  const STRATEGY_LABELS: Record<ResearchStrategy, string> = {
    standard: 'Standard',
    perplexity: 'Perplexity Research',
    openai_deep: 'OpenAI Deep Research',
    multi_model: 'Multi-Model Pipeline',
  };

  return (
    <div className="flex-1 space-y-2">
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          className="input input-sm input-bordered flex-1"
          placeholder="What should the LLM work on?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) handleSubmit();
            if (e.key === 'Escape') handleCancel();
            if (e.key === 'Tab' && !showDescription) {
              e.preventDefault();
              setShowDescription(true);
            }
          }}
        />
        <select
          className="select select-sm select-bordered w-44"
          value={strategy}
          onChange={e => setStrategy(e.target.value as ResearchStrategy)}
        >
          {Object.entries(STRATEGY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <label className="label cursor-pointer gap-1">
          <input
            type="checkbox"
            className="checkbox checkbox-xs checkbox-primary"
            checked={autoRun}
            onChange={e => setAutoRun(e.target.checked)}
          />
          <span className="label-text text-xs">Auto-run</span>
        </label>
        <button className="btn btn-sm btn-primary" onClick={handleSubmit}>
          {autoRun && hasApiKey ? 'Add & Run' : 'Add'}
        </button>
        <button className="btn btn-sm btn-ghost" onClick={handleCancel}>
          Cancel
        </button>
      </div>
      {showDescription && (
        <textarea
          className="textarea textarea-bordered textarea-sm w-full"
          rows={2}
          placeholder="Optional description or additional context... (Enter to submit)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            if (e.key === 'Escape') handleCancel();
          }}
          autoFocus
        />
      )}
      {!showDescription && (
        <p className="text-xs text-base-content/40">
          Press Tab to add a description, Enter to submit
        </p>
      )}
    </div>
  );
}
