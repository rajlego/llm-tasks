import type { LLMTask } from '../models/task';
import { useTaskStore } from '../store/taskStore';

interface ExportData {
  version: number;
  exportedAt: string;
  tasks: LLMTask[];
}

export function exportToJSON(): void {
  const tasks = useTaskStore.getState().tasks;
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `llm-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromJSON(
  file: File,
  mode: 'merge' | 'replace',
): Promise<{ imported: number; skipped: number }> {
  const text = await file.text();
  const data: ExportData = JSON.parse(text);

  if (!data.version || !Array.isArray(data.tasks)) {
    throw new Error('Invalid backup format');
  }

  const store = useTaskStore.getState();
  let imported = 0;
  let skipped = 0;

  if (mode === 'replace') {
    // Replace all tasks
    useTaskStore.setState({ tasks: data.tasks });
    imported = data.tasks.length;
  } else {
    // Merge: add new, update existing by ID
    const existingIds = new Set(store.tasks.map(t => t.id));
    for (const task of data.tasks) {
      if (existingIds.has(task.id)) {
        store.updateTask(task.id, task);
        imported++;
      } else {
        useTaskStore.setState(s => ({ tasks: [...s.tasks, task] }));
        imported++;
      }
    }
  }

  return { imported, skipped };
}
