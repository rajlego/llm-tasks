import { useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { MODEL_REGISTRY } from '../../models/agent';
import { exportToJSON, importFromJSON } from '../../services/exportImport';

export function SettingsView() {
  const settings = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (mode: 'merge' | 'replace') => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    try {
      const result = await importFromJSON(file, mode);
      alert(`Imported ${result.imported} tasks`);
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : err}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>

      {/* API Keys */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-sm">API Keys</h3>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">OpenRouter API Key</span>
              <span className={`label-text-alt ${settings.openRouterApiKey ? 'text-success' : 'text-error'}`}>
                {settings.openRouterApiKey ? 'Configured' : 'Required'}
              </span>
            </div>
            <input
              type="password"
              className="input input-sm input-bordered w-full"
              placeholder="sk-or-v1-..."
              value={settings.openRouterApiKey}
              onChange={e => settings.setOpenRouterApiKey(e.target.value)}
            />
            <div className="label">
              <span className="label-text-alt">
                Used for most models including Perplexity research
              </span>
            </div>
          </label>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">OpenAI API Key (Optional)</span>
              <span className="label-text-alt">
                {settings.openAIApiKey ? 'Configured' : 'Not set'}
              </span>
            </div>
            <input
              type="password"
              className="input input-sm input-bordered w-full"
              placeholder="sk-..."
              value={settings.openAIApiKey}
              onChange={e => settings.setOpenAIApiKey(e.target.value)}
            />
            <div className="label">
              <span className="label-text-alt">
                Only needed for OpenAI Deep Research
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Default Model */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-sm">Default Model</h3>

          <select
            className="select select-sm select-bordered w-full"
            value={settings.defaultModelId}
            onChange={e => settings.setDefaultModelId(e.target.value)}
          >
            {MODEL_REGISTRY.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider}) - ${model.inputPricePerMToken}/M in
              </option>
            ))}
          </select>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">Temperature</span>
              <span className="label-text-alt">{settings.defaultTemperature}</span>
            </div>
            <input
              type="range"
              className="range range-sm range-primary"
              min="0"
              max="1"
              step="0.1"
              value={settings.defaultTemperature}
              onChange={e => settings.setDefaultTemperature(parseFloat(e.target.value))}
            />
          </label>
        </div>
      </div>

      {/* Theme */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-sm">Appearance</h3>

          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map(theme => (
              <button
                key={theme}
                className={`btn btn-sm ${settings.theme === theme ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => settings.setTheme(theme)}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cost */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-sm">Cost Tracking</h3>

          <div className="flex items-center justify-between">
            <span className="text-sm">Total spent this month</span>
            <span className="font-mono">${settings.totalSpent.toFixed(2)}</span>
          </div>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">Monthly budget alert ($)</span>
            </div>
            <input
              type="number"
              className="input input-sm input-bordered w-full"
              value={settings.monthlyBudget}
              onChange={e => settings.setMonthlyBudget(parseFloat(e.target.value) || 0)}
            />
          </label>

          <button
            className="btn btn-sm btn-ghost btn-error mt-2"
            onClick={() => settings.resetSpent()}
          >
            Reset Spending Counter
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-sm">Data Management</h3>

          <div className="flex gap-2">
            <button className="btn btn-sm btn-outline" onClick={exportToJSON}>
              Export Backup (JSON)
            </button>
          </div>

          <div className="divider my-1" />

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="file-input file-input-sm file-input-bordered w-full"
          />
          <div className="flex gap-2 mt-2">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => handleImport('merge')}
            >
              Import (Merge)
            </button>
            <button
              className="btn btn-sm btn-outline btn-warning"
              onClick={() => handleImport('replace')}
            >
              Import (Replace All)
            </button>
          </div>
          <p className="text-xs text-base-content/40 mt-1">
            Merge adds new tasks and updates existing. Replace overwrites everything.
          </p>
        </div>
      </div>
    </div>
  );
}
