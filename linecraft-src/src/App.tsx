import { useCallback, useEffect, useRef, useState } from "react";
import { Check, FileText, PenLine, Plus, Settings, Sparkles, SwatchBook, X } from "lucide-react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { StyleProfilePanel } from "@/components/style/StyleProfilePanel";
import { ContextDumpPanel } from "@/components/context/ContextDumpPanel";
import { WriteWorkspace } from "@/components/write/WriteWorkspace";
import { ExportPanel } from "@/components/export/ExportPanel";
import { Logo } from "@/components/ui/Logo";
import type { StyleProfile } from "@/types/styleProfile";
import type { WritingProject } from "@/types/project";
import { getStyleProfile } from "@/lib/storage/styleProfiles";
import { createProject, getAllProjects, getProject } from "@/lib/storage/projects";
import { getApiKey, getAppState, getSettings, saveAppState } from "@/lib/storage/settings";
import { testOpenCodeGoConnection } from "@/lib/ai/opencodeGo";

const STEPS = [{ id: "style", label: "Style", icon: SwatchBook }, { id: "context", label: "Context", icon: FileText }, { id: "write", label: "Write", icon: PenLine }] as const;
type Step = (typeof STEPS)[number]["id"];

export function App() {
  const savedState = getAppState();
  const [ready, setReady] = useState(false); const [needsConnection, setNeedsConnection] = useState(!getApiKey());
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [step, setStep] = useState<Step>("style"); const [settingsOpen, setSettingsOpen] = useState(false); const [exportOpen, setExportOpen] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(savedState.activeProfileId); const [activeProfile, setActiveProfile] = useState<StyleProfile | null>(null);
  const [currentProject, setCurrentProject] = useState<WritingProject | null>(null); const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { (async () => { const state = getAppState(); let project = state.lastProjectId ? await getProject(state.lastProjectId) : undefined; if (!project) project = (await getAllProjects())[0]; if (project) { setCurrentProject(project); setStep("write"); saveAppState({ lastProjectId: project.id }); if (!activeProfileId && project.selectedStyleProfileId) setActiveProfileId(project.selectedStyleProfileId); } setReady(true); })(); }, []);
  useEffect(() => { if (activeProfileId) { getStyleProfile(activeProfileId).then((p) => setActiveProfile(p ?? null)); saveAppState({ activeProfileId }); } }, [activeProfileId]);
  useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === "Escape") { setSettingsOpen(false); setExportOpen(false); triggerRef.current?.focus(); } }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  useEffect(() => { const key = getApiKey(); if (!key) return; const settings = getSettings(); testOpenCodeGoConnection(key, settings.selectedModel).then((ok) => setConnectionFailed(!ok)).catch(() => setConnectionFailed(true)); }, []);
  const projectChange = useCallback((project: WritingProject) => { setCurrentProject(project); saveAppState({ lastProjectId: project.id }); }, []);
  const quickWrite = async () => { const profileId = activeProfileId ?? "direct-academic"; setActiveProfileId(profileId); const project = await createProject({ title: "Untitled draft", selectedStyleProfileId: profileId }); projectChange(project); setStep("write"); };
  const openModal = (kind: "settings" | "export", button: HTMLButtonElement) => { triggerRef.current = button; if (kind === "settings") setSettingsOpen(true); else setExportOpen(true); };
  const closeModals = () => { setSettingsOpen(false); setExportOpen(false); requestAnimationFrame(() => triggerRef.current?.focus()); };

  if (!ready) return <div className="min-h-screen grid place-items-center bg-paper"><Sparkles className="w-6 h-6 text-brand-700 animate-pulse"/></div>;
  if (needsConnection) return <div className="min-h-screen bg-paper grid place-items-center px-4"><div className="w-full max-w-md p-6 sm:p-8 matte-card"><SettingsPanel onboarding onConnected={() => { saveAppState({ onboardingComplete: true }); setNeedsConnection(false); }}/></div></div>;

  return <div className="min-h-screen bg-paper text-ink">
    <header className="sticky top-0 z-50 matte-header border-b border-line"><div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-4"><Logo size={25}/><nav className="flex items-center gap-1 ml-auto sm:ml-4" aria-label="Writing workflow">{STEPS.map((item, index) => { const Icon = item.icon; const active = step === item.id; const complete = item.id === "style" ? !!activeProfile : item.id === "context" ? !!currentProject?.rawContext : !!currentProject; return <button key={item.id} onClick={() => setStep(item.id)} className={`workflow-step ${active ? "active" : ""}`}><span className="step-number">{complete && !active ? <Check className="w-3 h-3"/> : index + 1}</span><Icon className="w-3.5 h-3.5 sm:hidden"/><span className="hidden sm:inline">{item.label}</span></button>; })}</nav><button onClick={quickWrite} className="hidden sm:flex btn-quiet"><Plus className="w-3.5 h-3.5"/>Quick write</button><button onClick={(e) => openModal("settings", e.currentTarget)} className="icon-button" aria-label="Settings"><Settings className="w-4 h-4"/></button></div></header>
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
      {connectionFailed && <button onClick={(e) => openModal("settings", e.currentTarget)} className="notice-error w-full mb-4 text-left"><span><strong>OpenCode needs attention.</strong> Your local work is safe. Reconnect before using AI actions.</span></button>}
      {step === "style" && <StyleProfilePanel onSelectProfile={setActiveProfileId} activeProfileId={activeProfile?.id ?? null} onContinue={() => setStep("context")}/>}
      {step === "context" && <ContextDumpPanel activeProfile={activeProfile} currentProject={currentProject} onProjectChange={projectChange} onDraftGenerated={() => setStep("write")}/>}
      {step === "write" && <WriteWorkspace styleProfile={activeProfile} currentProject={currentProject} onProjectChange={projectChange} onGenerateDraft={() => setStep("context")} onQuickWrite={quickWrite} onExport={(button) => openModal("export", button)}/>}
    </main>
    <Modal open={settingsOpen} title="Settings" subtitle="Connection and model preferences" onClose={closeModals}><SettingsPanel onConnected={() => setConnectionFailed(false)} onForgotten={() => { closeModals(); setNeedsConnection(true); }}/></Modal>
    <Modal open={exportOpen} title="Export" subtitle="Copy, download, or back up your work" onClose={closeModals}><ExportPanel currentProject={currentProject} embedded/></Modal>
  </div>;
}

function Modal({ open, title, subtitle, onClose, children }: { open: boolean; title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}><button className="absolute inset-0 bg-stone-900/25 backdrop-blur-sm" onClick={onClose} aria-label={`Close ${title}`}/><div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto matte-modal"><div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 matte-header border-b border-line"><div><h2 className="text-lg font-semibold">{title}</h2><p className="text-xs text-ink-muted">{subtitle}</p></div><button onClick={onClose} className="icon-button" aria-label={`Close ${title}`}><X className="w-4 h-4"/></button></div><div className="p-6">{children}</div></div></div>;
}
