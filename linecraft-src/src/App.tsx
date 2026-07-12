import { useState, useEffect, useCallback } from "react";
import { Settings, BookType, FileText, PenLine, Download, X } from "lucide-react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { StyleProfilePanel } from "@/components/style/StyleProfilePanel";
import { ContextDumpPanel } from "@/components/context/ContextDumpPanel";
import { WriteWorkspace } from "@/components/write/WriteWorkspace";
import { ExportPanel } from "@/components/export/ExportPanel";
import { Logo } from "@/components/ui/Logo";
import type { StyleProfile } from "@/types/styleProfile";
import type { WritingProject } from "@/types/project";
import { getStyleProfile } from "@/lib/storage/styleProfiles";

const TABS = [
  { id: "style", label: "Style", icon: BookType }, { id: "context", label: "Context", icon: FileText },
  { id: "write", label: "Write", icon: PenLine }, { id: "export", label: "Export", icon: Download },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("style");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<StyleProfile | null>(null);
  const [currentProject, setCurrentProject] = useState<WritingProject | null>(null);

  useEffect(() => { if (activeProfileId) getStyleProfile(activeProfileId).then((p) => setActiveProfile(p ?? null)); }, [activeProfileId]);
  const handleProjectChange = useCallback((project: WritingProject) => setCurrentProject(project), []);

  return <div className="min-h-screen bg-paper text-ink">
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Logo size={26} />
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-inset rounded-xl p-0.5 border border-line">
            {TABS.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${active ? "bg-white text-brand-700 shadow-sm" : "text-ink-secondary hover:text-ink"}`}><Icon className="w-3.5 h-3.5"/><span className="hidden sm:inline">{tab.label}</span></button>; })}
          </div>
          <button onClick={() => setSettingsOpen((v) => !v)} className={`p-2 rounded-lg ${settingsOpen ? "bg-brand-50 text-brand-700" : "text-ink-secondary hover:bg-inset"}`} title="Settings"><Settings className="w-4 h-4"/></button>
        </div>
      </div>
    </header>
    {settingsOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Settings">
      <button className="absolute inset-0 bg-ink/35 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} aria-label="Close settings"/>
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-paper border border-line shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur border-b border-line"><div><h2 className="text-lg font-semibold">Settings</h2><p className="text-xs text-ink-muted">Model, API key, and connection preferences</p></div><button onClick={() => setSettingsOpen(false)} className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-inset" aria-label="Close settings"><X className="w-4 h-4"/></button></div>
        <div className="px-6 py-6"><SettingsPanel/></div>
      </div>
    </div>}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
      {activeTab === "style" && <StyleProfilePanel onSelectProfile={setActiveProfileId} activeProfileId={activeProfile?.id ?? null}/>}
      {activeTab === "context" && <ContextDumpPanel activeProfile={activeProfile} currentProject={currentProject} onProjectChange={handleProjectChange} onDraftGenerated={() => setActiveTab("write")}/>}
      {activeTab === "write" && <WriteWorkspace styleProfile={activeProfile} currentProject={currentProject} onProjectChange={handleProjectChange} onGenerateDraft={() => setActiveTab("context")}/>}
      {activeTab === "export" && <ExportPanel currentProject={currentProject}/>}
    </main>
  </div>;
}
