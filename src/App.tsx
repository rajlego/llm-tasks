import { AppShell } from './components/layout/AppShell';
import { BoardView } from './components/views/BoardView';
import { ListView } from './components/views/ListView';
import { SettingsView } from './components/views/SettingsView';
import { TaskDetailView } from './components/views/TaskDetailView';
import { useUIStore } from './store/uiStore';
import { useSettingsStore } from './store/settingsStore';
import { useKeyboard } from './hooks/useKeyboard';
import { useEffect } from 'react';

function App() {
  const currentView = useUIStore(s => s.currentView);
  const theme = useSettingsStore(s => s.theme);

  useKeyboard();

  // Apply theme
  useEffect(() => {
    const resolvedTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [theme]);

  return (
    <AppShell>
      {currentView === 'board' && <BoardView />}
      {currentView === 'list' && <ListView />}
      {currentView === 'settings' && <SettingsView />}
      <TaskDetailView />
    </AppShell>
  );
}

export default App;
