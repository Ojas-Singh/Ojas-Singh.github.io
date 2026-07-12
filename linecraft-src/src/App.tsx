import { useState, useEffect, useCallback } from "react";
import { Settings, BookType, FileText, PenLine, Download } from "lucide-react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { StyleProfilePanel } from "@/components/style/StyleProfilePanel";
import { ContextDumpPanel } from "@/components/context/ContextDumpPanel";
import { WriteWorkspace } from "@/components/write/WriteWorkspace";
import { ExportPanel } from "@/components/export/ExportPanel";
import { Logo } from "@/components/ui/Logo";
import type { StyleProfile } from "@/types/styleProfile";
import type { WritingProject } from "@/types/project";
import { getStyleProfile } from "@/lib/storage/styleProfiles";
import { updateProject } from "@/lib/storage/projects";

const TABS = [
  { id: "style", label: "Style", icon: BookType },
  { id: "context", label: "Context", icon: FileText },
  { id: "write", label: "Write", icon: PenLine },
  { id: "export", label: "Export", icon: Download },
] as const;

type TabId = (typeof TABS)[number]["id"];
type Selection = { start: number; end: number; text: string };

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("style");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<StyleProfile | null>(null);
  const [currentProject, setCurrentProject] = useState<WritingProject | null>(null);
  const [draftText, setDraftText] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);

  useEffect(() => {
    if (activeProfileId) {
      getStyleProfile(activeProfileId).then((p) => setActiveProfile(p ?? null));
    }
  }, [activeProfileId]);

  useEffect(() => {
    setDraftText(currentProject?.currentDraft ?? "");
  }, [currentProject]);

  const handleProfileSelect = useCallback((profileId: string) => {
    setActiveProfileId(profileId);
  }, []);

  const handleProjectChange = useCallback((project: WritingProject) => {
    setCurrentProject(project);
  }, []);

  const handleDraftGenerated = useCallback((_draft: string) => {
    setActiveTab("write");
  }, []);

  const handleDraftChange = useCallback(
    async (newText: string) => {
      setDraftText(newText);
      if (currentProject) {
        const updated = await updateProject(currentProject.id, { currentDraft: newText });
        if (updated) setCurrentProject(updated);
      }
    },
    [currentProject]
  );

  const handleRestoreVersion = useCallback(
    async (text: string) => {
      setDraftText(text);
      if (currentProject) {
        const updated = await updateProject(currentProject.id, { currentDraft: text });
        if (updated) setCurrentProject(updated);
      }
    },
    [currentProject]
  );

  const handleGenerateDraft = useCallback(() => {
    setActiveTab("context");
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Logo size={26} />

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-inset rounded-xl p-0.5 border border-line">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-150
                      ${
                        isActive
                          ? "bg-white text-brand-700 shadow-sm"
                          : "text-ink-secondary hover:text-ink"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`p-2 rounded-lg transition-all duration-150
                ${
                  settingsOpen
                    ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                    : "text-ink-secondary hover:text-ink hover:bg-inset"
                }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {settingsOpen && (
        <div className="border-b border-line bg-white/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-2xl mx-auto px-6 py-6">
            <SettingsPanel />
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div key={activeTab} className="animate-fade-in">
          <TabContent
            tab={activeTab}
            activeProfile={activeProfile}
            onProfileSelect={handleProfileSelect}
            currentProject={currentProject}
            onProjectChange={handleProjectChange}
            onDraftGenerated={handleDraftGenerated}
            draftText={draftText}
            onDraftChange={handleDraftChange}
            onRestoreVersion={handleRestoreVersion}
            onGenerateDraft={handleGenerateDraft}
            selection={selection}
            onSelectionChange={setSelection}
          />
        </div>
      </main>
    </div>
  );
}

function TabContent({
  tab,
  activeProfile,
  onProfileSelect,
  currentProject,
  onProjectChange,
  onDraftGenerated,
  draftText,
  onDraftChange,
  onRestoreVersion,
  onGenerateDraft,
  selection,
  onSelectionChange,
}: {
  tab: TabId;
  activeProfile: StyleProfile | null;
  onProfileSelect: (id: string) => void;
  currentProject: WritingProject | null;
  onProjectChange: (p: WritingProject) => void;
  onDraftGenerated: (draft: string) => void;
  draftText: string;
  onDraftChange: (text: string) => void;
  onRestoreVersion: (text: string) => void;
  onGenerateDraft: () => void;
  selection: Selection | null;
  onSelectionChange: (sel: Selection | null) => void;
}) {
  if (tab === "style") {
    return (
      <StyleProfilePanel onSelectProfile={onProfileSelect} activeProfileId={activeProfile?.id ?? null} />
    );
  }
  if (tab === "context") {
    return (
      <ContextDumpPanel
        activeProfile={activeProfile}
        currentProject={currentProject}
        onProjectChange={onProjectChange}
        onDraftGenerated={onDraftGenerated}
      />
    );
  }
  if (tab === "write") {
    return (
      <WriteWorkspace
        draftText={draftText}
        styleProfile={activeProfile}
        currentProject={currentProject}
        onDraftChange={onDraftChange}
        onProjectChange={onProjectChange}
        onRestoreVersion={onRestoreVersion}
        onGenerateDraft={onGenerateDraft}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
    );
  }
  if (tab === "export") {
    return <ExportPanel currentProject={currentProject} />;
  }

  return null;
}
