import { useRef, useCallback } from "react";
import { Sparkles, ClipboardPaste, Clock, User, Target, BookType } from "lucide-react";
import type { StyleProfile } from "@/types/styleProfile";
import type { WritingProject } from "@/types/project";
import { SelectionSidebar } from "./SelectionSidebar";
import { Button } from "@/components/ui/Button";

type Selection = { start: number; end: number; text: string };

type Props = {
  draftText: string;
  styleProfile: StyleProfile | null;
  currentProject: WritingProject | null;
  onDraftChange: (text: string) => void;
  onProjectChange: (project: WritingProject) => void;
  onRestoreVersion: (text: string) => void;
  onGenerateDraft: () => void;
  selection: Selection | null;
  onSelectionChange: (sel: Selection | null) => void;
};

function readingTime(text: string): string {
  const words = text.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

export function WriteWorkspace({
  draftText,
  styleProfile,
  currentProject,
  onDraftChange,
  onProjectChange,
  onRestoreVersion,
  onGenerateDraft,
  selection,
  onSelectionChange,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleMouseUp = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start !== end) {
      const text = draftText.slice(start, end);
      if (text.trim()) {
        onSelectionChange({ start, end, text });
        return;
      }
    }
    onSelectionChange(null);
  }, [draftText, onSelectionChange]);

  const handleKeyUp = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const handleAcceptVariant = useCallback(
    (newText: string) => {
      if (!selection) return;
      const before = draftText.slice(0, selection.start);
      const after = draftText.slice(selection.end);
      const updated = before + newText + after;
      onDraftChange(updated);
      onSelectionChange(null);
    },
    [draftText, selection, onDraftChange, onSelectionChange]
  );

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onDraftChange(text);
    } catch {
      // clipboard access denied
    }
  };

  const words = draftText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              {currentProject ? currentProject.title : "Untitled Draft"}
            </h2>
            {currentProject && (
              <p className="text-xs text-ink-muted mt-0.5">
                {currentProject.targetFormat}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handlePaste}>
              <ClipboardPaste className="w-3.5 h-3.5" />
              Paste
            </Button>
            <Button variant="primary" size="sm" onClick={onGenerateDraft}>
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </Button>
          </div>
        </div>

        {currentProject && (currentProject.audience || currentProject.goal || styleProfile) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 rounded-xl bg-card border border-line text-xs text-ink-secondary">
            {styleProfile && (
              <span className="flex items-center gap-1.5">
                <BookType className="w-3 h-3 text-brand-600" />
                {styleProfile.name}
              </span>
            )}
            {currentProject.audience && (
              <span className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-ink-muted" />
                {currentProject.audience}
              </span>
            )}
            {currentProject.goal && (
              <span className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-ink-muted" />
                {currentProject.goal}
              </span>
            )}
            {currentProject.targetFormat && (
              <span className="ml-auto px-2 py-0.5 rounded-md bg-inset text-ink-muted border border-line">
                {currentProject.targetFormat}
              </span>
            )}
          </div>
        )}

        <div className="rounded-2xl bg-card border border-line shadow-sm shadow-black/[0.03] overflow-hidden transition-shadow focus-within:shadow-md focus-within:shadow-black/[0.06] focus-within:border-brand-200">
          <textarea
            ref={textareaRef}
            value={draftText}
            onChange={(e) => onDraftChange(e.target.value)}
            onMouseUp={handleMouseUp}
            onKeyUp={handleKeyUp}
            onBlur={() => {
              setTimeout(() => {
                if (textareaRef.current) {
                  const start = textareaRef.current.selectionStart;
                  const end = textareaRef.current.selectionEnd;
                  if (start === end) onSelectionChange(null);
                }
              }, 200);
            }}
            placeholder="Write, paste, or generate a draft here…&#10;&#10;Highlight any text to refine it with AI."
            className="draft-textarea px-8 py-7"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span>{words.toLocaleString()} words</span>
          <span className="text-line">·</span>
          <span>{draftText.length.toLocaleString()} chars</span>
          {draftText.trim() && (
            <>
              <span className="text-line">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {readingTime(draftText)}
              </span>
            </>
          )}
          {selection && (
            <>
              <span className="text-line">·</span>
              <span className="text-brand-600 font-medium">
                {selection.text.length} chars selected
              </span>
            </>
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <SelectionSidebar
            selection={selection}
            draftText={draftText}
            styleProfile={styleProfile}
            project={currentProject}
            onAcceptVariant={handleAcceptVariant}
            onProjectChange={onProjectChange}
            onRestoreVersion={onRestoreVersion}
          />
        </div>
      </div>
    </div>
  );
}
