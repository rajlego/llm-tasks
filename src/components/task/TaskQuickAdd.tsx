import { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';

export function TaskQuickAdd() {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addTask = useTaskStore(s => s.addTask);
  const quickAddOpen = useUIStore(s => s.quickAddOpen);
  const setQuickAddOpen = useUIStore(s => s.setQuickAddOpen);

  useEffect(() => {
    if (quickAddOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [quickAddOpen]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(trimmed);
    setTitle('');
    setQuickAddOpen(false);
  };

  if (!quickAddOpen) return null;

  return (
    <div className="flex gap-2 items-center">
      <input
        ref={inputRef}
        type="text"
        className="input input-sm input-bordered flex-1"
        placeholder="What should the LLM work on?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') {
            setTitle('');
            setQuickAddOpen(false);
          }
        }}
      />
      <button className="btn btn-sm btn-primary" onClick={handleSubmit}>
        Add
      </button>
      <button
        className="btn btn-sm btn-ghost"
        onClick={() => {
          setTitle('');
          setQuickAddOpen(false);
        }}
      >
        Cancel
      </button>
    </div>
  );
}
