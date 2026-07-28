import { useCallback, useEffect, useRef, useState } from "react";
import { BookType, ClipboardPaste, Download, FileText, Plus, Redo2, Sparkles, Target, Undo2, User } from "lucide-react";
import type { StyleProfile } from "@/types/styleProfile";
import type { WritingProject, VersionAction } from "@/types/project";
import type { WritingDocument } from "@/types/sentence";
import { Button } from "@/components/ui/Button";
import { cloneDocument, documentToText, emptyDocument, textToDocument } from "@/lib/sentence/document";
import { createVersion, updateProject } from "@/lib/storage/projects";
import { SentenceInspector, type TextSelection } from "./SentenceInspector";
import { wordDiff } from "@/lib/sentence/language";

type Props = { styleProfile: StyleProfile | null; currentProject: WritingProject | null; onProjectChange: (p: WritingProject) => void; onGenerateDraft: () => void; onQuickWrite: () => void; onExport: (button: HTMLButtonElement) => void };

export function WriteWorkspace({ styleProfile, currentProject, onProjectChange, onGenerateDraft, onQuickWrite, onExport }: Props) {
  const document = currentProject?.document ?? emptyDocument();
  const text = documentToText(document);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const undo = useRef<WritingDocument[]>([]); const redo = useRef<WritingDocument[]>([]);
  const editTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localText, setLocalText] = useState(text); // Local state for smooth typing
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // Sync local text when project changes externally (undo/redo/restore)
  useEffect(() => {
    setLocalText(text);
    undo.current = [];
    redo.current = [];
    setSelection(null);
  }, [currentProject?.id, text]);

  const commit = useCallback(async (next: WritingDocument, action: VersionAction, name: string, snapshot = true) => {
    if (!currentProject) return;
    if (snapshot) undo.current.push(cloneDocument(currentProject.document));
    redo.current = [];
    const version = createVersion(name, next, action);
    const updated = await updateProject(currentProject.id, { document: next, versions: [...currentProject.versions, version] });
    if (updated) onProjectChange(updated);
  }, [currentProject, onProjectChange]);

  const updateText = (value: string) => {
    if (!currentProject) return;
    setLocalText(value); // Immediate local update for smooth typing

    // Debounced sync to project
    if (editTimer.current) clearTimeout(editTimer.current);
    editTimer.current = setTimeout(() => {
      const next = textToDocument(value, "manual");
      void commit(next, "edited", "Draft edited", false);
      void updateProject(currentProject.id, { document: next }).then((p) => p && onProjectChange(p));
    }, 300); // Faster debounce for typing
  };
  const readSelection = () => { const el = textarea.current; setPreviewText(null); if (!el || el.selectionStart === el.selectionEnd) { setSelection(null); return; } const selected = localText.slice(el.selectionStart, el.selectionEnd); setSelection(selected.trim() ? { start: el.selectionStart, end: el.selectionEnd, text: selected } : null); };
  const replaceSelection = (replacement: string) => { if (!selection) return; const nextText = localText.slice(0, selection.start) + replacement + localText.slice(selection.end); setLocalText(nextText); void commit(textToDocument(nextText, "rewrite"), "rewrite", "Accepted highlighted rewrite"); setSelection(null); };
  const paste = async () => { try { const value = await navigator.clipboard.readText(); if (value) void commit(textToDocument(value, "pasted"), "inserted", "Pasted draft"); } catch { /* denied */ } };
  const travel = async (direction: "undo" | "redo") => { if (!currentProject) return; const from = direction === "undo" ? undo.current : redo.current; const to = direction === "undo" ? redo.current : undo.current; const next = from.pop(); if (!next) return; to.push(cloneDocument(document)); const updated = await updateProject(currentProject.id, { document: next }); if (updated) onProjectChange(updated); setSelection(null); };
  const restore = (next: WritingDocument) => commit(cloneDocument(next), "restored", "Version restored");
  const words = localText.split(/\s+/).filter(Boolean).length;

  if (!currentProject) return <div className="max-w-xl mx-auto text-center p-10 matte-card"><Sparkles className="w-8 h-8 text-brand-700 mx-auto mb-3"/><h2 className="text-xl font-semibold">How do you want to begin?</h2><p className="text-sm text-ink-muted mt-2 mb-5">Start with a blank page or build a guided draft from context.</p><div className="flex justify-center gap-2"><Button onClick={onQuickWrite}><Plus className="w-4 h-4"/>Quick write</Button><Button onClick={onGenerateDraft}><FileText className="w-4 h-4"/>Guided draft</Button></div></div>;
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 matte-panel"><div className="min-w-0 mr-2"><h2 className="text-sm font-semibold truncate">{currentProject.title}</h2><p className="text-[10px] text-ink-muted">{words} words · {Math.max(1, Math.round(words / 200))} min</p></div><div className="hidden md:flex min-w-0 items-center gap-3 text-[11px] text-ink-secondary border-l border-line pl-3">{styleProfile && <span className="flex gap-1"><BookType className="w-3 h-3 text-brand-700"/>{styleProfile.name}</span>}{currentProject.audience && <span className="flex gap-1"><User className="w-3 h-3"/>{currentProject.audience}</span>}{currentProject.goal && <span className="flex gap-1 max-w-48 truncate"><Target className="w-3 h-3 flex-none"/>{currentProject.goal}</span>}</div><span className="hidden sm:inline ml-auto text-[10px] text-ink-muted">{currentProject.targetFormat}</span><div className="flex gap-1 sm:ml-1"><Button variant="secondary" size="sm" onClick={() => travel("undo")} title="Undo"><Undo2 className="w-3.5 h-3.5"/><span className="hidden xl:inline">Undo</span></Button><Button variant="secondary" size="sm" onClick={() => travel("redo")} title="Redo"><Redo2 className="w-3.5 h-3.5"/><span className="hidden xl:inline">Redo</span></Button><Button variant="secondary" size="sm" onClick={paste} title="Paste"><ClipboardPaste className="w-3.5 h-3.5"/><span className="hidden xl:inline">Paste</span></Button><Button variant="secondary" size="sm" onClick={(e) => onExport(e.currentTarget)} title="Export"><Download className="w-3.5 h-3.5"/><span className="hidden xl:inline">Export</span></Button></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
      <div><div className={`highlight-editor rounded-2xl bg-card border shadow-sm overflow-hidden focus-within:border-brand-300 focus-within:shadow-md ${selection ? "border-brand-300" : "border-line"}`}><div ref={backdrop} className="highlight-backdrop" aria-hidden="true">{selection ? <>{localText.slice(0, selection.start)}<mark className={previewText ? "diff-preview" : ""}>{previewText ? wordDiff(selection.text, previewText).map((part, i) => <span key={i} className={`diff-${part.kind}`}>{part.value}</span>) : localText.slice(selection.start, selection.end)}</mark>{localText.slice(selection.end)}</> : localText}</div><textarea ref={textarea} value={localText} onChange={(e) => updateText(e.target.value)} onMouseUp={readSelection} onKeyUp={readSelection} onScroll={(e) => { if (backdrop.current) { backdrop.current.scrollTop = e.currentTarget.scrollTop; backdrop.current.scrollLeft = e.currentTarget.scrollLeft; } }} placeholder="Write naturally here… Highlight any sentence or passage to refine it." className="draft-textarea highlight-input px-7 py-7" spellCheck/></div><p className="mt-1.5 text-[11px] text-ink-muted">Hover an option to preview its full diff directly in the document.</p></div>
      <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1"><SentenceInspector selection={selection} document={document} project={currentProject} styleProfile={styleProfile} onProjectChange={onProjectChange} onAccept={replaceSelection} onPreview={setPreviewText} onRestore={restore}/></div>
    </div>
  </div>;
}
