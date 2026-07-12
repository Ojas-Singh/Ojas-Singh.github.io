import { useState, useRef } from "react";
import {
  Copy,
  Check,
  Download,
  Upload,
  FileText,
  FileCode,
  FileJson,
  AlertCircle,
} from "lucide-react";
import type { WritingProject } from "@/types/project";
import { getAllProjects, createProject } from "@/lib/storage/projects";
import { getAllStyleProfiles, saveStyleProfile } from "@/lib/storage/styleProfiles";

type Props = {
  currentProject: WritingProject | null;
};

export function ExportPanel({ currentProject }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const draftText = currentProject?.currentDraft ?? "";

  const handleCopy = async () => {
    if (!draftText) return;
    await navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!draftText) return;
    const blob = new Blob([draftText], { type: "text/plain" });
    downloadBlob(blob, `${currentProject?.title ?? "draft"}.txt`);
  };

  const handleDownloadMd = () => {
    if (!draftText) return;
    const title = currentProject?.title ?? "Draft";
    const md = `# ${title}\n\n${draftText}`;
    const blob = new Blob([md], { type: "text/markdown" });
    downloadBlob(blob, `${currentProject?.title ?? "draft"}.md`);
  };

  const handleExportProject = async () => {
    if (!currentProject) return;
    const blob = new Blob([JSON.stringify(currentProject, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, `${currentProject.title}.linecraft.json`);
  };

  const handleExportAll = async () => {
    const [projects, profiles] = await Promise.all([
      getAllProjects(),
      getAllStyleProfiles(),
    ]);
    const data = { projects, styleProfiles: profiles, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, `linecraft-export-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImport = async (file: File) => {
    setError("");
    setImportSuccess("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.projects && Array.isArray(data.projects)) {
        let imported = 0;
        for (const project of data.projects) {
          await createProject(project);
          imported++;
        }
        if (data.styleProfiles && Array.isArray(data.styleProfiles)) {
          for (const profile of data.styleProfiles) {
            await saveStyleProfile(profile);
          }
        }
        setImportSuccess(
          `Imported ${imported} project${imported !== 1 ? "s" : ""}${
            data.styleProfiles
              ? ` and ${data.styleProfiles.length} style profile${data.styleProfiles.length !== 1 ? "s" : ""}`
              : ""
          }. Reload the page to see changes.`
        );
      } else if (data.id && data.title) {
        await createProject(data as WritingProject);
        setImportSuccess("Imported 1 project. Reload the page to see changes.");
      } else {
        setError("Unknown file format. Expected a LineCraft project or full export.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse import file.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Export</h2>
        <p className="text-sm text-ink-secondary mt-1">
          Copy, download, or back up your work. All data stays in your browser.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {importSuccess && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
          {importSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ExportButton
          icon={Copy}
          label="Copy to Clipboard"
          desc="Copy the current draft as plain text."
          onClick={handleCopy}
          disabled={!draftText}
          success={copied ? "Copied!" : undefined}
        />
        <ExportButton
          icon={FileText}
          label="Download .txt"
          desc="Plain text file."
          onClick={handleDownloadTxt}
          disabled={!draftText}
        />
        <ExportButton
          icon={FileCode}
          label="Download .md"
          desc="Markdown with title."
          onClick={handleDownloadMd}
          disabled={!draftText}
        />
        <ExportButton
          icon={FileJson}
          label="Export Project"
          desc="Full project as .linecraft.json"
          onClick={handleExportProject}
          disabled={!currentProject}
        />
        <ExportButton
          icon={Download}
          label="Export Everything"
          desc="All projects & style profiles."
          onClick={handleExportAll}
          disabled={false}
        />
      </div>

      <div className="p-6 rounded-2xl bg-card border border-line shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Upload className="w-4 h-4 text-brand-600" />
          Import
        </h3>
        <p className="text-xs text-ink-muted">
          Import a previously exported LineCraft project (.json) or a full export.
        </p>
        <button
          onClick={() => fileInput.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     bg-white border border-line text-ink-secondary hover:text-ink
                     hover:border-line-hover transition-all"
        >
          <Upload className="w-4 h-4" />
          Select .json file
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}

function ExportButton({
  icon: Icon,
  label,
  desc,
  onClick,
  disabled,
  success,
}: {
  icon: typeof Copy;
  label: string;
  desc: string;
  onClick: () => void;
  disabled: boolean;
  success?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-start gap-3 p-4 rounded-xl border border-line bg-card
                 hover:border-brand-300 hover:shadow-sm disabled:opacity-40
                 disabled:cursor-not-allowed text-left transition-all duration-150"
    >
      {success ? (
        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <Icon className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <span className="text-sm font-medium text-ink block">
          {success ?? label}
        </span>
        <span className="text-xs text-ink-muted">{desc}</span>
      </div>
    </button>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
