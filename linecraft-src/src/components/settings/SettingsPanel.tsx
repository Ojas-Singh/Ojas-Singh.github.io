import { useEffect, useState } from "react";
import { CheckCircle, Key, Loader2, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { DEFAULT_MODEL, OPENCODE_GO_MODELS, type AppSettings } from "@/types/settings";
import { clearApiKey, getApiKey, getSettings, saveApiKey, saveSettings } from "@/lib/storage/settings";
import { fetchOpenCodeGoModels, testOpenCodeGoConnection, type OpenCodeGoModel } from "@/lib/ai/opencodeGo";

type Props = { onboarding?: boolean; onConnected?: () => void; onForgotten?: () => void };
const inputClass = "w-full px-3.5 py-2.5 rounded-xl bg-white/55 border border-line text-ink text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20";

export function SettingsPanel({ onboarding = false, onConnected, onForgotten }: Props) {
  const initial = getSettings();
  const [settings, setSettings] = useState<AppSettings>(initial);
  const [key, setKey] = useState(getApiKey() ?? "");
  const [models, setModels] = useState<OpenCodeGoModel[]>(OPENCODE_GO_MODELS.map((m) => ({ ...m })));
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => { fetchOpenCodeGoModels().then((value) => value.length && setModels(value)).catch(() => undefined); }, []);

  const updateModel = (selectedModel: string) => { const next = { ...settings, selectedModel }; setSettings(next); saveSettings(next); };
  const connect = async () => {
    if (!key.trim()) { setStatus("error"); setError("Enter your OpenCode API key."); return; }
    setStatus("testing"); setError("");
    try {
      const next = { ...settings, apiKeyStorageMode: "local" as const, selectedModel: settings.selectedModel || DEFAULT_MODEL };
      saveSettings(next); saveApiKey(key.trim());
      const ok = await testOpenCodeGoConnection(key.trim(), next.selectedModel);
      if (!ok) throw new Error("OpenCode responded without the expected confirmation.");
      setSettings(next); setStatus("success"); onConnected?.();
    } catch (cause) { clearApiKey(); setStatus("error"); setError(cause instanceof Error ? cause.message : "Connection failed."); }
  };
  const forget = () => { clearApiKey(); setKey(""); setStatus("idle"); onForgotten?.(); };

  return <div className="space-y-5">
    {onboarding && <div className="text-center mb-7"><div className="w-11 h-11 mx-auto rounded-2xl bg-brand-200/70 border border-brand-300 grid place-items-center mb-3"><Key className="w-5 h-5 text-brand-800"/></div><h1 className="text-2xl font-semibold tracking-tight">Connect OpenCode</h1><p className="text-sm text-ink-secondary mt-1">One connection, then LineCraft remembers this device.</p></div>}
    <div className="flex items-center justify-between p-3 rounded-xl matte-panel"><span className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="w-4 h-4 text-success"/>OpenCode Go</span><span className="text-xs text-ink-muted">Local launcher connected</span></div>
    <label className="block"><span className="field-label">API key</span><input type="password" value={key} onChange={(e) => { setKey(e.target.value); setStatus("idle"); }} placeholder="sk-…" className={inputClass}/><p className="text-xs text-ink-muted mt-1.5">Saved on this browser after a successful test. Avoid this option on shared devices.</p></label>
    <label className="block"><span className="field-label">Model</span><select value={settings.selectedModel} onChange={(e) => updateModel(e.target.value)} className={inputClass}>{models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
    <button onClick={connect} disabled={status === "testing"} className="w-full btn-primary">{status === "testing" ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}{status === "testing" ? "Testing connection…" : onboarding ? "Connect and continue" : "Save and test"}</button>
    {status === "success" && <div className="notice-success"><CheckCircle className="w-4 h-4"/>Connection successful.</div>}
    {status === "error" && <div className="notice-error"><XCircle className="w-4 h-4 flex-none"/><span>{error}</span></div>}
    {!onboarding && getApiKey() && <button onClick={forget} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50/60 rounded-xl"><Trash2 className="w-4 h-4"/>Forget API key</button>}
  </div>;
}
