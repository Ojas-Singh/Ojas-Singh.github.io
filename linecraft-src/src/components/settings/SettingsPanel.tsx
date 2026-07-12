import { useEffect, useState } from "react";
import { Key, Shield, CheckCircle, XCircle, Loader2, Server } from "lucide-react";
import { AppSettings, KeyStorageMode, OPENCODE_GO_MODELS } from "@/types/settings";
import { getSettings, saveSettings, getApiKey, saveApiKey } from "@/lib/storage/settings";
import { fetchOpenCodeGoModels, testOpenCodeGoConnection } from "@/lib/ai/opencodeGo";

const STORAGE_OPTIONS: { value: KeyStorageMode; label: string; desc: string }[] = [
  { value: "session", label: "This session only", desc: "Cleared when you close the browser tab." },
  { value: "local", label: "Save on this device", desc: "Persists across sessions. Less secure." },
  { value: "none", label: "Do not save", desc: "You must enter the key each time." },
];

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line text-ink text-sm " +
  "placeholder-ink-muted transition-all " +
  "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15";

const labelClass =
  "text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5";

export function SettingsPanel() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [keyInput, setKeyInput] = useState(getApiKey() ?? "");
  const [proxyInput, setProxyInput] = useState(settings.proxyUrl ?? "");
  const [models, setModels] = useState(OPENCODE_GO_MODELS);
  const [modelStatus, setModelStatus] = useState<"loading" | "success" | "fallback">("loading");
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchOpenCodeGoModels()
      .then((loadedModels) => {
        if (cancelled) return;
        if (loadedModels.length > 0) {
          setModels(loadedModels);
          setModelStatus("success");
        } else {
          setModelStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setModelStatus("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveSettings = (s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  const handleSaveKey = () => {
    if (keyInput.trim()) {
      saveApiKey(keyInput.trim());
    }
  };

  const handleSaveProxy = () => {
    handleSaveSettings({ ...settings, proxyUrl: proxyInput.trim() });
  };

  const handleTest = async () => {
    if (!keyInput.trim()) {
      setErrorMsg("Enter an API key first.");
      setStatus("error");
      return;
    }

    handleSaveKey();
    handleSaveProxy();
    setStatus("testing");
    setErrorMsg("");

    try {
      const ok = await testOpenCodeGoConnection(keyInput.trim(), settings.selectedModel);
      if (ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg("The API responded but did not return the expected confirmation.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-brand-600" />
        <h2 className="text-lg font-semibold text-ink">API Settings</h2>
      </div>

      <div>
        <span className={labelClass}>Provider</span>
        <div className="px-3.5 py-2.5 rounded-xl bg-inset border border-line text-sm text-ink-secondary">
          OpenCode Go - opencode.ai/zen/go/v1
        </div>
        <p className="text-xs text-ink-muted mt-1.5">
          Model listing works from the browser. AI generation depends on OpenCode Go allowing browser CORS for chat completions.
        </p>
      </div>

      <div>
        <label htmlFor="api-key" className={labelClass}>
          <span className="inline-flex items-center gap-1.5">
            <Key className="w-3 h-3" />
            API Key
          </span>
        </label>
        <input
          id="api-key"
          type="password"
          value={keyInput}
          onChange={(e) => {
            setKeyInput(e.target.value);
            setStatus("idle");
            setErrorMsg("");
          }}
          onBlur={handleSaveKey}
          placeholder="sk-..."
          className={inputClass}
        />
        <p className="text-xs text-ink-muted mt-1.5">
          Your key is sent to OpenCode Go{settings.proxyUrl ? " through your advanced proxy override" : ""}.{" "}
          <span className="text-amber-600">
            In a browser app, the key cannot be truly hidden.
          </span>
        </p>
      </div>

      <div>
        <span className={labelClass}>Key storage mode</span>
        <div className="space-y-2">
          {STORAGE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                ${
                  settings.apiKeyStorageMode === opt.value
                    ? "border-brand-300 bg-brand-50/50"
                    : "border-line bg-white hover:border-line-hover"
                }`}
            >
              <input
                type="radio"
                name="storage-mode"
                value={opt.value}
                checked={settings.apiKeyStorageMode === opt.value}
                onChange={() => {
                  const s = { ...settings, apiKeyStorageMode: opt.value };
                  handleSaveSettings(s);
                }}
                className="mt-0.5 accent-brand-600"
              />
              <div>
                <span className="text-sm text-ink">{opt.label}</span>
                <p className="text-xs text-ink-muted mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="model" className={labelClass}>Model</label>
        <select
          id="model"
          value={settings.selectedModel}
          onChange={(e) => {
            const s = { ...settings, selectedModel: e.target.value };
            handleSaveSettings(s);
          }}
          className={inputClass}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-muted mt-1.5">
          {modelStatus === "loading" && "Loading current models from OpenCode Go..."}
          {modelStatus === "success" && "Loaded current models directly from OpenCode Go."}
          {modelStatus === "fallback" && "Using bundled model list because the live model list could not be loaded."}
        </p>
      </div>

      <div className="border-t border-line pt-5">
        <div className="flex items-center justify-between">
          <label htmlFor="proxy-url" className={labelClass}>
            <span className="inline-flex items-center gap-1.5">
              <Server className="w-3 h-3" />
              Advanced Proxy Override
            </span>
          </label>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
          >
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </button>
        </div>
        <p className="text-xs text-ink-muted mt-1.5">
          Browser-only mode calls OpenCode Go directly. Frontend JavaScript, GitHub Pages, Vite, and fetch options cannot bypass CORS if OpenCode blocks chat completions.
        </p>

        {showAdvanced && (
          <div className="mt-3 p-3 rounded-xl bg-inset border border-line text-xs text-ink-secondary space-y-2">
            <p className="font-medium text-ink">Optional proxy URL</p>
            <input
              id="proxy-url"
              type="text"
              value={proxyInput}
              onChange={(e) => setProxyInput(e.target.value)}
              onBlur={handleSaveProxy}
              placeholder="https://your-proxy.example.com"
              className={inputClass}
            />
            <p className="text-ink-muted mt-2">
              Leave this blank for browser-only mode. Use it only if you later have a trusted proxy available.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleTest}
        disabled={status === "testing"}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                   bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed
                   text-white shadow-sm shadow-brand-600/20 transition-all"
      >
        {status === "testing" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        Test Connection
      </button>

      {status === "success" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Connection successful - OpenCode Go chat completions are reachable{settings.proxyUrl ? " through the advanced proxy override" : " from this browser"}.
        </div>
      )}

      {status === "error" && errorMsg && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
