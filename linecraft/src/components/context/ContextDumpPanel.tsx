import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import type { StyleProfile } from "@/types/styleProfile";
import type { WritingProject } from "@/types/project";
import { getApiKey, getSettings } from "@/lib/storage/settings";
import { callOpenCodeGo } from "@/lib/ai/opencodeGo";
import { buildDraftPrompt, getDraftSystemMessage } from "@/lib/ai/prompts";
import { createProject, updateProject, createVersion } from "@/lib/storage/projects";
import { FORMATS } from "@/lib/ai/formats";

type Props = {
  activeProfile: StyleProfile | null;
  currentProject: WritingProject | null;
  onProjectChange: (project: WritingProject) => void;
  onDraftGenerated: (draft: string) => void;
};

export function ContextDumpPanel({
  activeProfile,
  currentProject,
  onProjectChange,
  onDraftGenerated,
}: Props) {
  const [title, setTitle] = useState(currentProject?.title ?? "");
  const [targetFormat, setTargetFormat] = useState(currentProject?.targetFormat ?? FORMATS[0]);
  const [audience, setAudience] = useState(currentProject?.audience ?? "");
  const [goal, setGoal] = useState(currentProject?.goal ?? "");
  const [rawContext, setRawContext] = useState(currentProject?.rawContext ?? "");
  const [mustInclude, setMustInclude] = useState(currentProject?.mustInclude ?? "");
  const [niceToInclude, setNiceToInclude] = useState(currentProject?.niceToInclude ?? "");
  const [doNotSay, setDoNotSay] = useState(currentProject?.doNotSay ?? "");
  const [evidence, setEvidence] = useState(currentProject?.evidence ?? "");
  const [toneOverride, setToneOverride] = useState(currentProject?.toneOverride ?? "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // Sync from project when it changes externally (e.g., on first load)
  useEffect(() => {
    if (currentProject) {
      setTitle(currentProject.title ?? "");
      setTargetFormat(currentProject.targetFormat ?? FORMATS[0]);
      setAudience(currentProject.audience ?? "");
      setGoal(currentProject.goal ?? "");
      setRawContext(currentProject.rawContext ?? "");
      setMustInclude(currentProject.mustInclude ?? "");
      setNiceToInclude(currentProject.niceToInclude ?? "");
      setDoNotSay(currentProject.doNotSay ?? "");
      setEvidence(currentProject.evidence ?? "");
      setToneOverride(currentProject.toneOverride ?? "");
    }
  }, [currentProject?.id]);

  // Debounced auto-save of context fields
  const contextSnapshot = `${title}|${targetFormat}|${audience}|${goal}|${rawContext}|${mustInclude}|${niceToInclude}|${doNotSay}|${evidence}|${toneOverride}`;

  useEffect(() => {
    if (contextSnapshot === lastSavedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      lastSavedRef.current = contextSnapshot;
      const projectTitle = title.trim() || `Draft — ${targetFormat}`;

      if (currentProject?.id) {
        const updated = await updateProject(currentProject.id, {
          title: projectTitle,
          targetFormat,
          audience,
          goal,
          rawContext,
          mustInclude,
          niceToInclude,
          doNotSay,
          evidence,
          toneOverride,
        });
        if (updated) onProjectChange(updated);
      } else if (rawContext.trim()) {
        // Only create a project once there's actual context
        const project = await createProject({
          title: projectTitle,
          targetFormat,
          audience,
          goal,
          rawContext,
          mustInclude,
          niceToInclude,
          doNotSay,
          evidence,
          toneOverride,
        });
        onProjectChange(project);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [contextSnapshot]);

  const handleGenerate = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("Please configure your API key in Settings first.");
      return;
    }
    if (!activeProfile) {
      setError("Please select a style profile in the Style tab first.");
      return;
    }
    if (!rawContext.trim()) {
      setError("Please enter your raw context / notes.");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const settings = getSettings();
      const draftText = await callOpenCodeGo({
        apiKey,
        model: settings.selectedModel,
        temperature: 0.7,
        messages: [
          { role: "system", content: getDraftSystemMessage() },
          {
            role: "user",
            content: buildDraftPrompt({
              styleProfile: activeProfile,
              targetFormat,
              audience,
              goal,
              rawContext,
              mustInclude,
              niceToInclude,
              doNotSay,
              evidence,
              toneOverride,
            }),
          },
        ],
      });

      const projectTitle = title.trim() || `Draft — ${targetFormat}`;

      let project: WritingProject;
      if (currentProject?.id) {
        const updated = await updateProject(currentProject.id, {
          title: projectTitle,
          targetFormat,
          audience,
          goal,
          rawContext,
          mustInclude,
          niceToInclude,
          doNotSay,
          evidence,
          toneOverride,
          selectedStyleProfileId: activeProfile.id,
          currentDraft: draftText,
        });
        if (updated) {
          project = updated;
        } else {
          project = await createProject({
            title: projectTitle,
            targetFormat,
            audience,
            goal,
            rawContext,
            mustInclude,
            niceToInclude,
            doNotSay,
            evidence,
            toneOverride,
            selectedStyleProfileId: activeProfile.id,
            currentDraft: draftText,
          });
        }
      } else {
        project = await createProject({
          title: projectTitle,
          targetFormat,
          audience,
          goal,
          rawContext,
          mustInclude,
          niceToInclude,
          doNotSay,
          evidence,
          toneOverride,
          selectedStyleProfileId: activeProfile.id,
          currentDraft: draftText,
        });
      }

      const version = createVersion("v1 — Raw AI draft", draftText);
      await updateProject(project.id, {
        versions: [...(project.versions ?? []), version],
      });

      onProjectChange(project);
      onDraftGenerated(draftText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Dump Your Context</h2>
          <p className="text-sm text-ink-secondary mt-1">
            Messy is fine. Bullet points, half-written thoughts, arguments, data — the AI will organize it.
          </p>
        </div>
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1 pt-1">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
      </div>

      {!activeProfile && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          No style profile selected. Go to the Style tab to select or create one first.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="p-6 rounded-2xl bg-card border border-line shadow-sm space-y-5">
        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">Draft Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Reviewer response — paper #42…"
            className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                       text-ink placeholder-ink-muted text-sm transition-all
                       focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">Target Format</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                       text-ink text-sm transition-all
                       focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
          >
            {FORMATS.map((f: string) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">Audience</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Journal reviewers, my advisor…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                         text-ink placeholder-ink-muted text-sm transition-all
                         focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">Goal</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Convince reviewers this method is valid…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                         text-ink placeholder-ink-muted text-sm transition-all
                         focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            />
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-line shadow-sm">
        <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">
          Raw Context <span className="text-red-500 normal-case">*</span>
        </label>
        <p className="text-xs text-ink-muted mb-2">
          Dump everything — bullet points, half-written thoughts, arguments, data.
        </p>
        <textarea
          value={rawContext}
          onChange={(e) => setRawContext(e.target.value)}
          placeholder="Paste your rough notes, arguments, bullet points, data, or half-written ideas here…"
          rows={10}
          className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                     text-ink placeholder-ink-muted text-sm resize-y font-draft leading-relaxed
                     focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 transition-all"
        />
      </div>

      <div className="p-6 rounded-2xl bg-card border border-line shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">Must Include</label>
          <textarea
            value={mustInclude}
            onChange={(e) => setMustInclude(e.target.value)}
            placeholder="Points that must appear…"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                       text-ink placeholder-ink-muted text-sm resize-y transition-all
                       focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">Nice to Include</label>
          <textarea
            value={niceToInclude}
            onChange={(e) => setNiceToInclude(e.target.value)}
            placeholder="Optional but helpful…"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                       text-ink placeholder-ink-muted text-sm resize-y transition-all
                       focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">Do Not Say</label>
          <textarea
            value={doNotSay}
            onChange={(e) => setDoNotSay(e.target.value)}
            placeholder="Phrases or ideas to avoid…"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                       text-ink placeholder-ink-muted text-sm resize-y transition-all
                       focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">Evidence / Examples</label>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Data points, citations, examples…"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                       text-ink placeholder-ink-muted text-sm resize-y transition-all
                       focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
          />
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-line shadow-sm">
        <label className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5">Tone Override</label>
        <input
          value={toneOverride}
          onChange={(e) => setToneOverride(e.target.value)}
          placeholder="e.g., More respectful than usual, more critical…"
          className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line
                     text-ink placeholder-ink-muted text-sm transition-all
                     focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || !activeProfile}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                   bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed
                   text-white shadow-sm shadow-brand-600/20 transition-all"
      >
        {generating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {generating ? "Generating draft…" : "Generate Draft"}
      </button>
    </div>
  );
}
