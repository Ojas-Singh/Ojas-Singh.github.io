import { useMemo, useState } from "react";
import { AlertCircle, Check, History, Loader2, MessageSquarePlus, ShieldCheck, X } from "lucide-react";
import { v4 as uuid } from "uuid";
import type { StyleProfile } from "@/types/styleProfile";
import type { WritingProject } from "@/types/project";
import type { RewriteCandidate, RewriteFreedom, RewriteIntent, WritingDocument } from "@/types/sentence";
import { documentToText } from "@/lib/sentence/document";
import { findPhraseMatches } from "@/lib/sentence/language";
import { getApiKey, getSettings } from "@/lib/storage/settings";
import { updateProject } from "@/lib/storage/projects";
import { callOpenCodeGo } from "@/lib/ai/opencodeGo";
import { buildControlRoomRewritePrompt, getControlRoomRewriteSystemMessage } from "@/lib/ai/prompts";
import { parseRewriteCandidates } from "@/lib/ai/json";
import { VersionPanel } from "@/components/draft/VersionPanel";

export type TextSelection = { start: number; end: number; text: string };
const INTENTS: { value: RewriteIntent; label: string }[] = [
  { value: "simpler", label: "Simpler" }, { value: "shorter", label: "Shorter" },
  { value: "detailed", label: "More detailed" }, { value: "natural", label: "More natural" },
  { value: "confident", label: "More confident" }, { value: "technical", label: "More technical" },
  { value: "options", label: "Give options" },
];
const REASONS = ["Too generic", "Sounds like AI", "Changed meaning", "Not my voice"];
type Props = { selection: TextSelection | null; document: WritingDocument; project: WritingProject; styleProfile: StyleProfile | null; onProjectChange: (p: WritingProject) => void; onAccept: (text: string) => void; onPreview: (text: string | null) => void; onRestore: (d: WritingDocument) => void };

export function SentenceInspector({ selection, document, project, styleProfile, onProjectChange, onAccept, onPreview, onRestore }: Props) {
  const [freedom, setFreedom] = useState<RewriteFreedom>("balanced");
  const [lockMeaning, setLockMeaning] = useState(true);
  const [candidates, setCandidates] = useState<RewriteCandidate[]>([]);
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [extraContext, setExtraContext] = useState(""); const [customReason, setCustomReason] = useState("");
  const prohibited = useMemo(() => [...(styleProfile?.avoidPhrases ?? []), ...project.doNotSay.split(/[\n,;]/).map((x) => x.trim()).filter(Boolean)], [styleProfile, project.doNotSay]);

  if (!selection) return <div className="p-5 rounded-2xl bg-card border border-line"><div className="mb-5 p-4 rounded-xl bg-inset text-center"><p className="text-sm font-medium">Highlight text to refine it</p><p className="text-xs text-ink-muted mt-1">Select a sentence or passage in the writing box.</p></div><div className="flex items-center gap-2 mb-4"><History className="w-4 h-4 text-brand-600"/><h3 className="text-sm font-semibold">History</h3></div><VersionPanel project={project} document={document} onRestoreVersion={onRestore} onProjectChange={onProjectChange}/></div>;

  const preferred = styleProfile?.preferredPhrases ?? styleProfile?.typicalPhrases ?? [];
  const bad = findPhraseMatches(selection.text, prohibited); const good = findPhraseMatches(selection.text, preferred);
  const fullText = documentToText(document); const start = fullText.lastIndexOf("\n\n", selection.start - 1) + 2; const end = fullText.indexOf("\n\n", selection.end); const paragraph = fullText.slice(start, end < 0 ? fullText.length : end);
  const generate = async (intent: RewriteIntent) => {
    const apiKey = getApiKey(); if (!apiKey) { setError("Configure your API key in Settings first."); return; }
    setLoading(true); setError(""); setCandidates([]); onPreview(null);
    try {
      const settings = getSettings();
      const raw = await callOpenCodeGo({ apiKey, model: settings.selectedModel, temperature: freedom === "safe" ? .2 : freedom === "bold" ? .75 : .45, maxTokens: 1800, messages: [
        { role: "system", content: getControlRoomRewriteSystemMessage() },
        { role: "user", content: buildControlRoomRewritePrompt({ selectedText: selection.text, paragraph, intent, freedom, lockMeaning, localContext: extraContext, audience: project.audience, goal: project.goal, doNotSay: prohibited, preferredPhrases: preferred, style: styleProfile ?? { voice: "Direct and clear", tone: "Professional", sentenceRhythm: "Varied", rules: [] }, feedback: project.feedback.slice(-8).map((f) => f.reason) }) },
      ] });
      setCandidates(parseRewriteCandidates(raw));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not generate variants."); }
    finally { setLoading(false); }
  };
  const accept = (c: RewriteCandidate) => { if (lockMeaning && c.meaning.risk === "high" && confirmId !== c.id) { setConfirmId(c.id); return; } onPreview(null); onAccept(c.text); setCandidates([]); setConfirmId(null); };
  const reject = async (c: RewriteCandidate, reason: string) => { const feedback = { id: uuid(), sentenceId: `selection:${selection.start}`, candidateText: c.text, reason, createdAt: new Date().toISOString() }; const updated = await updateProject(project.id, { feedback: [...project.feedback, feedback] }); if (updated) onProjectChange(updated); setCandidates((v) => v.filter((x) => x.id !== c.id)); onPreview(null); setCustomReason(""); };

  return <aside className="p-4 rounded-2xl bg-card border border-brand-200 shadow-sm space-y-3">
    <div className="flex items-center gap-2"><div className="w-1 h-5 rounded bg-brand-600"/><h3 className="text-sm font-semibold">Refine highlight</h3></div>
    {(bad.length > 0 || good.length > 0) && <div className="text-xs">{bad.length > 0 && <p className="text-red-600">Avoided: {bad.join(", ")}</p>}{good.length > 0 && <p className="text-green-700">Preferred: {good.join(", ")}</p>}</div>}
    <div className="grid grid-cols-2 gap-1.5">{INTENTS.map((x) => <button key={x.value} disabled={loading} onClick={() => generate(x.value)} className="px-2 py-1.5 rounded-lg bg-inset border border-line text-xs hover:border-brand-300 hover:text-brand-700 disabled:opacity-40">{x.label}</button>)}</div>
    <div className="flex items-center justify-between"><div className="flex bg-inset p-0.5 rounded-lg">{(["safe", "balanced", "bold"] as const).map((x) => <button key={x} onClick={() => setFreedom(x)} className={`px-2 py-1 text-[10px] rounded-md capitalize ${freedom === x ? "bg-white text-brand-700 shadow-sm" : "text-ink-muted"}`}>{x}</button>)}</div><button onClick={() => setLockMeaning((v) => !v)} className={`flex gap-1 text-xs ${lockMeaning ? "text-green-700" : "text-ink-muted"}`}><ShieldCheck className="w-3.5 h-3.5"/>Meaning {lockMeaning ? "locked" : "unlocked"}</button></div>
    <label><span className="text-[11px] uppercase font-semibold text-ink-muted flex gap-1 mb-1"><MessageSquarePlus className="w-3 h-3"/>Add context</span><textarea value={extraContext} onChange={(e) => setExtraContext(e.target.value)} rows={2} className="w-full p-2.5 bg-inset border border-line rounded-lg text-xs" placeholder="Facts or instructions; the replacement may use multiple sentences…"/></label>
    {loading && <p className="text-xs text-brand-700 flex gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin"/>Generating options…</p>}{error && <p className="text-xs text-red-600 flex gap-2"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}
    {candidates.length > 0 && <p className="text-[10px] text-ink-muted">Hover an option to compare it in the document.</p>}
    {candidates.map((c) => <article key={c.id} onMouseEnter={() => onPreview(c.text)} onMouseLeave={() => onPreview(null)} className="p-3 rounded-xl border border-line hover:border-brand-400 hover:bg-brand-50/40 transition-colors space-y-2 cursor-default">
      <div className="flex justify-between"><span className="text-[10px] uppercase font-semibold text-brand-600">{c.label}</span><span className={`text-[10px] ${c.meaning.risk === "high" ? "text-red-600" : c.meaning.risk === "medium" ? "text-amber-600" : "text-green-600"}`}>{c.meaning.risk} risk</span></div>
      <p className="font-draft text-sm leading-5">{c.text}</p>
      {confirmId === c.id && <p className="text-xs text-red-600">Meaning may change. Click Accept again to confirm.</p>}
      <div className="flex flex-wrap gap-1"><button onClick={() => accept(c)} className="px-2 py-1 bg-brand-600 text-white rounded text-xs flex gap-1"><Check className="w-3 h-3"/>Accept</button>{REASONS.map((r) => <button key={r} onClick={() => reject(c, r)} className="px-2 py-1 bg-inset rounded text-[10px] text-ink-muted">{r}</button>)}<button onClick={() => reject(c, customReason || "Rejected")}><X className="w-3 h-3"/></button></div>
      <input value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Optional rejection reason…" className="w-full px-2 py-1 border border-line rounded text-xs"/>
    </article>)}
  </aside>;
}
