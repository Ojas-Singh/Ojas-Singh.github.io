import { useEffect, useState } from "react";
import { Key, Shield, CheckCircle, XCircle, Loader2, Server, Copy } from "lucide-react";
import { AppSettings, DEFAULT_PROXY_URL, KeyStorageMode, OPENCODE_GO_MODELS } from "@/types/settings";
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

const WINDOWS_PROXY_COMMAND =
  "irm https://ojas-singh.github.io/linecraft/local-opencode-proxy.mjs | node --input-type=module";
const UNIX_PROXY_COMMAND =
  "curl -fsSL https://ojas-singh.github.io/linecraft/local-opencode-proxy.mjs | node --input-type=module";
const HEALTH_CHECK_COMMAND = "curl http://localhost:8787/health";

function CopyCommandButton({
  label,
  command,
  copiedCommand,
  onCopy,
}: {
  label: string;
  command: string;
  copiedCommand: string;
  onCopy: (command: string) => void;
}) {
  const copied = copiedCommand === command;

  return (
    <div className="rounded-lg border border-line bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-line">
        <span className="text-xs font-medium text-ink">{label}</span>
        <button
          type="button"
          onClick={() => onCopy(command)}
          className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-3 py-2 text-[11px] leading-relaxed text-ink-secondary overflow-x-auto whitespace-pre-wrap">
        <code>{command}</code>
      </pre>
    </div>
  );
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [keyInput, setKeyInput] = useState(getApiKey() ?? "");
  const [proxyInput, setProxyInput] = useState(settings.proxyUrl || DEFAULT_PROXY_URL);
  const [models, setModels] = useState(OPENCODE_GO_MODELS);
  const [modelStatus, setModelStatus] = useState<"loading" | "success" | "fallback">("loading");
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [copiedCommand, setCopiedCommand] = useState("");

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
    handleSaveSettings({ ...settings, proxyUrl: proxyInput.trim() || DEFAULT_PROXY_URL });
  };

  const handleCopyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      window.setTimeout(() => setCopiedCommand(""), 1800);
    } catch {
      setCopiedCommand("");
    }
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
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
      if (message.includes(DEFAULT_PROXY_URL)) {
        setShowAdvanced(true);
      }
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
          Your key is sent to OpenCode Go through your local proxy.{" "}
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
              Local Proxy
            </span>
          </label>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
          >
            {showAdvanced ? "Hide setup" : "Show setup"}
          </button>
        </div>
        <p className="text-xs text-ink-muted mt-1.5">
          Run one command in your terminal, keep it open, then use the default proxy URL below.
        </p>

        {showAdvanced && (
          <div className="mt-3 p-3 rounded-xl bg-inset border border-line text-xs text-ink-secondary space-y-3">
            <CopyCommandButton
              label="Windows PowerShell"
              command={WINDOWS_PROXY_COMMAND}
              copiedCommand={copiedCommand}
              onCopy={handleCopyCommand}
            />
            <CopyCommandButton
              label="macOS, Linux, or Git Bash"
              command={UNIX_PROXY_COMMAND}
              copiedCommand={copiedCommand}
              onCopy={handleCopyCommand}
            />
            <CopyCommandButton
              label="Health check"
              command={HEALTH_CHECK_COMMAND}
              copiedCommand={copiedCommand}
              onCopy={handleCopyCommand}
            />
            <p className="font-medium text-ink">Proxy URL</p>
            <input
              id="proxy-url"
              type="text"
              value={proxyInput}
              onChange={(e) => setProxyInput(e.target.value)}
              onBlur={handleSaveProxy}
              placeholder={DEFAULT_PROXY_URL}
              className={inputClass}
            />
            <p className="text-ink-muted mt-2">
              Default: {DEFAULT_PROXY_URL}. Keep the proxy terminal open while using LineCraft.
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
          Connection successful - OpenCode Go chat completions are reachable through the local proxy.
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
