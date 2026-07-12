import { useState } from "react";
import { Save, Copy, Check } from "lucide-react";
import type { WritingProject } from "@/types/project";
import { updateProject, createVersion } from "@/lib/storage/projects";

type Props = {
  project: WritingProject | null;
  onProjectChange: (project: WritingProject) => void;
  draftText: string;
  onDraftChange: (text: string) => void;
};

export function DraftEditor({ project, onProjectChange, draftText, onDraftChange }: Props) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveVersion = async () => {
    if (!project || !draftText.trim()) return;
    setSaving(true);
    try {
      const count = project.versions.length;
      const version = createVersion(`v${count + 1} — Saved manually`, draftText);
      const updated = await updateProject(project.id, {
        currentDraft: draftText,
        versions: [...project.versions, version],
      });
      if (updated) onProjectChange(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!draftText) return;
    await navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {project ? project.title : "Draft Editor"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleSaveVersion}
            disabled={!project || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-gray-800 hover:bg-gray-700 text-gray-300
                       disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Version"}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {!project ? (
        <div className="p-8 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
          <p className="text-gray-500 text-sm">
            No draft yet. Go to the Context tab to generate one.
          </p>
        </div>
      ) : (
        <textarea
          value={draftText}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={16}
          className="w-full px-3 py-3 rounded-lg bg-gray-800 border border-gray-700
                     text-gray-100 text-sm resize-y leading-relaxed
                     focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50
                     font-mono"
          placeholder="Your generated draft will appear here..."
        />
      )}

      {project && project.versions.length > 0 && (
        <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/30">
          <span className="text-xs text-gray-500">
            {project.versions.length} version{project.versions.length > 1 ? "s" : ""} saved
          </span>
        </div>
      )}
    </div>
  );
}
