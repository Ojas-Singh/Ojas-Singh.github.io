import { useState } from "react";
import { Save, RotateCcw, Trash2, Edit3, Check, X, History } from "lucide-react";
import type { WritingProject, DraftVersion } from "@/types/project";
import { updateProject, createVersion } from "@/lib/storage/projects";

type Props = {
  project: WritingProject | null;
  draftText: string;
  onRestoreVersion: (text: string) => void;
  onProjectChange: (project: WritingProject) => void;
};

export function VersionPanel({ project, draftText, onRestoreVersion, onProjectChange }: Props) {
  const [saving, setSaving] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  if (!project) {
    return (
      <div className="text-center py-6">
        <History className="w-6 h-6 text-ink-muted mx-auto mb-2" />
        <p className="text-sm text-ink-secondary font-medium">No project loaded</p>
        <p className="text-xs text-ink-muted mt-1">
          Generate or paste a draft to start saving versions.
        </p>
      </div>
    );
  }

  const versions = project.versions;

  const handleSave = async () => {
    if (!draftText.trim()) return;
    setSaving(true);
    try {
      const count = versions.length;
      const version = createVersion(`v${count + 1} — Saved`, draftText);
      const updated = await updateProject(project.id, {
        currentDraft: draftText,
        versions: [...versions, version],
      });
      if (updated) onProjectChange(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (version: DraftVersion) => {
    onRestoreVersion(version.text);
  };

  const handleDelete = async (versionId: string) => {
    const updated = await updateProject(project.id, {
      versions: versions.filter((v) => v.id !== versionId),
    });
    if (updated) onProjectChange(updated);
  };

  const startRename = (v: DraftVersion) => {
    setRenamingId(v.id);
    setRenameText(v.name);
  };

  const confirmRename = async () => {
    if (!renamingId) return;
    const updated = await updateProject(project.id, {
      versions: versions.map((v) =>
        v.id === renamingId ? { ...v, name: renameText } : v
      ),
    });
    if (updated) onProjectChange(updated);
    setRenamingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-ink">
            Versions <span className="text-ink-muted font-normal">({versions.length})</span>
          </h3>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     bg-brand-600 hover:bg-brand-500 disabled:opacity-40
                     text-white transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Save Current"}
        </button>
      </div>

      {versions.length === 0 ? (
        <p className="text-xs text-ink-muted">
          No versions saved yet. Save your current draft to create the first version.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {[...versions].reverse().map((v) => (
            <div
              key={v.id}
              className="group flex items-center gap-2 p-2.5 rounded-lg border border-line
                         bg-white hover:border-line-hover transition-all"
            >
              <div className="flex-1 min-w-0">
                {renamingId === v.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                      className="flex-1 px-2 py-0.5 rounded bg-inset border border-line
                                 text-ink text-xs transition-all
                                 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && confirmRename()}
                    />
                    <button onClick={confirmRename} className="text-green-600 hover:text-green-700">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setRenamingId(null)} className="text-ink-muted hover:text-ink">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-ink truncate block">{v.name}</span>
                )}
                <span className="text-[10px] text-ink-muted">
                  {new Date(v.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startRename(v)}
                  className="p-1 rounded text-ink-muted hover:text-ink transition-colors"
                  title="Rename"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleRestore(v)}
                  className="p-1 rounded text-ink-muted hover:text-brand-600 transition-colors"
                  title="Restore"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="p-1 rounded text-ink-muted hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
