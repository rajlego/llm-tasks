import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // API Keys
  openRouterApiKey: string;
  openAIApiKey: string;

  // Default execution config
  defaultModelId: string;
  defaultTemperature: number;
  defaultMaxTokens: number;

  // UI
  theme: 'light' | 'dark' | 'system';

  // Sync (future)
  cloudSyncEnabled: boolean;

  // Cost tracking
  monthlyBudget: number;
  totalSpent: number;

  // Actions
  setOpenRouterApiKey: (key: string) => void;
  setOpenAIApiKey: (key: string) => void;
  setDefaultModelId: (modelId: string) => void;
  setDefaultTemperature: (temp: number) => void;
  setDefaultMaxTokens: (tokens: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCloudSyncEnabled: (enabled: boolean) => void;
  setMonthlyBudget: (budget: number) => void;
  addToSpent: (amount: number) => void;
  resetSpent: () => void;
  hasApiKey: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
      openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      defaultModelId: 'anthropic/claude-sonnet-4',
      defaultTemperature: 0.7,
      defaultMaxTokens: 4096,
      theme: 'dark',
      cloudSyncEnabled: false,
      monthlyBudget: 10,
      totalSpent: 0,

      setOpenRouterApiKey: (key) => set({ openRouterApiKey: key }),
      setOpenAIApiKey: (key) => set({ openAIApiKey: key }),
      setDefaultModelId: (modelId) => set({ defaultModelId: modelId }),
      setDefaultTemperature: (temp) => set({ defaultTemperature: temp }),
      setDefaultMaxTokens: (tokens) => set({ defaultMaxTokens: tokens }),
      setTheme: (theme) => set({ theme }),
      setCloudSyncEnabled: (enabled) => set({ cloudSyncEnabled: enabled }),
      setMonthlyBudget: (budget) => set({ monthlyBudget: budget }),
      addToSpent: (amount) => set(s => ({ totalSpent: s.totalSpent + amount })),
      resetSpent: () => set({ totalSpent: 0 }),
      hasApiKey: () => get().openRouterApiKey.length > 0,
    }),
    {
      name: 'llm-tasks-settings',
    },
  ),
);
