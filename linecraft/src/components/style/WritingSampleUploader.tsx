import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { parseText } from "@/lib/parsing/text";
import { parseDocx } from "@/lib/parsing/docx";
import { parsePdf } from "@/lib/parsing/pdf";

type Props = {
  sampleText: string;
  onSampleChange: (text: string) => void;
  onExtract: () => void;
  loading: boolean;
};

export function WritingSampleUploader({
  sampleText,
  onSampleChange,
  onExtract,
  loading,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState("");

  const handleFile = async (file: File) => {
    setParseError("");
    setFileName(file.name);
    try {
      let text: string;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "txt" || ext === "md") {
        text = await parseText(file);
      } else if (ext === "docx") {
        text = await parseDocx(file);
      } else if (ext === "pdf") {
        text = await parsePdf(file);
      } else {
        setParseError(`Unsupported file type: .${ext}`);
        return;
      }
      onSampleChange(text);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse file.");
      setFileName(null);
    }
  };

  const clearFile = () => {
    setFileName(null);
    setParseError("");
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInput.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     bg-white border border-line text-ink-secondary hover:text-ink
                     hover:border-line-hover transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Sample
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".txt,.md,.docx,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
        <span className="text-xs text-ink-muted">.txt / .md / .docx / .pdf</span>
      </div>

      {fileName && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-sm">
          <FileText className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-brand-700">{fileName}</span>
          <button onClick={clearFile} className="ml-auto text-ink-muted hover:text-ink">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {parseError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {parseError}
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">
          Or paste a writing sample
        </label>
        <textarea
          value={sampleText}
          onChange={(e) => onSampleChange(e.target.value)}
          placeholder="Paste a paragraph or two of your writing here…"
          rows={8}
          className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                     text-ink placeholder-ink-muted text-sm resize-y font-draft leading-relaxed
                     focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 transition-all"
        />
      </div>

      <button
        onClick={onExtract}
        disabled={!sampleText.trim() || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                   bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed
                   text-white shadow-sm shadow-brand-600/20 transition-all"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        {loading ? "Extracting…" : "Extract Style Profile"}
      </button>
    </div>
  );
}
