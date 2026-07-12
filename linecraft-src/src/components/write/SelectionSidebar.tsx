import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, MessageSquarePlus, PenLine } from "lucide-react";
import type { StyleProfile } from "@/types/styleProfile";
import type { WritingProject } from "@/types/project";
import type { SentenceVariant } from "@/types/sentence";
import { getApiKey, getSettings } from "@/lib/storage/settings";
import { callOpenCodeGoStream, callOpenCodeGo } from "@/lib/ai/opencodeGo";
import {
  buildSentenceVariantsPrompt,
  getSentenceVariantsSystemMessage,
} from "@/lib/ai/prompts";
import { safeJsonParse } from "@/lib/ai/json";
import { VariantList } from "@/components/sentence/VariantPicker";
import { SentenceContextBox } from "@/components/sentence/SentenceContextBox";
import { VersionPanel } from "@/components/draft/VersionPanel";
import { Button } from "@/components/ui/Button";
import { v4 as uuid } from "uuid";

const VARIANT_COUNT = 8;

type Selection = { start: number; end: number; text: string };

type Props = {
  selection: Selection | null;
  draftText: string;
  styleProfile: StyleProfile | null;
  project: WritingProject | null;
  onAcceptVariant: (newText: string) => void;
  onProjectChange: (project: WritingProject) => void;
  onRestoreVersion: (text: string) => void;
};

export function SelectionSidebar({
  selection,
  draftText,
  styleProfile,
  project,
  onAcceptVariant,
  onProjectChange,
  onRestoreVersion,
}: Props) {
  const [variants, setVariants] = useState<SentenceVariant[]>([]);
  const [generating, setGenerating] = useState(false);
  const [receivedCount, setReceivedCount] = useState(0);
  const [error, setError] = useState("");
  const [contextBoxOpen, setContextBoxOpen] = useState(false);
  const [extraContext, setExtraContext] = useState("");

  if (!selection && !project) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-line text-center">
        <PenLine className="w-6 h-6 text-ink-muted mx-auto mb-3" />
        <p className="text-sm text-ink-secondary font-medium">
          Highlight text to refine it
        </p>
        <p className="text-xs text-ink-muted mt-1">
          Select any passage in your draft to get 8 AI alternatives in your style.
        </p>
      </div>
    );
  }

  if (!selection) {
    return (
      <div className="p-5 rounded-2xl bg-card border border-line shadow-sm">
        <VersionPanel
          project={project}
          draftText={draftText}
          onRestoreVersion={onRestoreVersion}
          onProjectChange={onProjectChange}
        />
      </div>
    );
  }

  const getParagraph = (): string => {
    const before = draftText.lastIndexOf("\n\n", selection.start - 1);
    const after = draftText.indexOf("\n\n", selection.end);
    const paraStart = before === -1 ? 0 : before + 2;
    const paraEnd = after === -1 ? draftText.length : after;
    return draftText.slice(paraStart, paraEnd).trim();
  };

  const handleGenerate = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("Configure your API key in Settings first.");
      return;
    }
    if (!selection.text.trim()) {
      setError("Highlight some text to rewrite.");
      return;
    }

    setGenerating(true);
    setError("");
    setVariants([]);
    setReceivedCount(0);

    const settings = getSettings();
    const paragraph = getParagraph();
    const messages = [
      { role: "system" as const, content: getSentenceVariantsSystemMessage() },
      {
        role: "user" as const,
        content: buildSentenceVariantsPrompt({
          styleProfile: styleProfile ?? {
            voice: "Direct and clear",
            tone: "Professional",
            sentenceRhythm: "Varied",
            rules: [],
          },
          paragraph,
          selectedText: selection.text,
          extraContext: extraContext || undefined,
          projectContext: project
            ? {
                audience: project.audience,
                goal: project.goal,
                mustInclude: project.mustInclude,
                doNotSay: project.doNotSay,
              }
            : undefined,
        }),
      },
    ];

    try {
      // Try streaming first
      let fullText = "";
      let buffer = "";
      let capturedCount = 0;

      const stream = callOpenCodeGoStream({
        apiKey,
        model: settings.selectedModel,
        temperature: 0.3,
        maxTokens: 1500,
        messages,
      });

      for await (const chunk of stream) {
        fullText += chunk;
        buffer += chunk;
        const extracted = extractCompleteObjects(buffer);
        if (extracted.newObjects.length > 0) {
          capturedCount += extracted.newObjects.length;
          setReceivedCount(capturedCount);
          setVariants((prev) => [
            ...prev,
            ...extracted.newObjects.map((o) => ({ ...o, id: uuid() })),
          ]);
          buffer = extracted.remaining;
        }
      }

      // Final extraction
      const final = extractCompleteObjects(buffer);
      if (final.newObjects.length > 0) {
        setVariants((prev) => [
          ...prev,
          ...final.newObjects.map((o) => ({ ...o, id: uuid() })),
        ]);
      }

      // Fallback: parse full text if progressive parsing produced nothing
      setVariants((prev) => {
        if (prev.length > 0) return prev;
        try {
          const all = safeJsonParse<{ label: string; text: string }[]>(fullText);
          return all.map((o) => ({ ...o, id: uuid() }));
        } catch {
          return prev;
        }
      });
    } catch {
      // Streaming failed — fall back to non-streaming
      try {
        const text = await callOpenCodeGo({
          apiKey,
          model: settings.selectedModel,
          temperature: 0.3,
          maxTokens: 1500,
          messages,
        });
        const parsed = safeJsonParse<{ label: string; text: string }[]>(text);
        setVariants(parsed.map((o) => ({ ...o, id: uuid() })));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate variants.");
      }
    } finally {
      setGenerating(false);
    }

    setContextBoxOpen(false);
  };

  const handleAccept = (variant: SentenceVariant) => {
    onAcceptVariant(variant.text);
    setVariants([]);
    setExtraContext("");
  };

  return (
    <div className="p-5 rounded-2xl bg-card border border-brand-200 shadow-sm space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-brand-600" />
          <h3 className="text-sm font-semibold text-ink">Refine Selection</h3>
        </div>
        <div className="p-3 rounded-lg bg-inset border border-line text-sm text-ink-secondary leading-relaxed font-draft italic">
          &ldquo;{selection.text}&rdquo;
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {generating && receivedCount > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-50 border border-brand-200 text-xs text-brand-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Generating… variant {receivedCount} of {VARIANT_COUNT}
        </div>
      )}

      {variants.length > 0 && (
        <VariantList
          variants={variants}
          onAccept={handleAccept}
          onRegenerate={() => handleGenerate()}
        />
      )}

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleGenerate}
          disabled={generating}
          className="flex-1"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generating
            ? receivedCount > 0
              ? `${receivedCount}/${VARIANT_COUNT}…`
              : "Generating…"
            : "Generate 8 Variants"}
        </Button>
        <button
          onClick={() => setContextBoxOpen(!contextBoxOpen)}
          className={`flex items-center justify-center px-3 rounded-lg transition-all duration-150
            ${
              contextBoxOpen
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "bg-inset text-ink-secondary border border-line hover:border-line-hover"
            }`}
          title="Add context for this selection"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>

      {contextBoxOpen && (
        <SentenceContextBox
          value={extraContext}
          onChange={setExtraContext}
          onClose={() => setContextBoxOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Extracts complete JSON objects from a streaming buffer.
 * Tracks brace depth to find balanced {...} at the top level of a JSON array.
 */
function extractCompleteObjects(
  buffer: string
): { newObjects: { label: string; text: string }[]; remaining: string } {
  const newObjects: { label: string; text: string }[] = [];
  let remaining = buffer;

  // Strip leading whitespace, opening bracket, commas between objects
  remaining = remaining.replace(/^[\s\[]*/, "");

  while (remaining.length > 0) {
    const trimmed = remaining.trimStart();
    if (!trimmed.startsWith("{")) {
      // If we hit ] or end, stop
      if (trimmed.startsWith("]")) break;
      remaining = trimmed;
      break;
    }

    // Find the matching closing brace
    let depth = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx === -1) {
      // Incomplete object, wait for more data
      remaining = trimmed;
      break;
    }

    const objStr = trimmed.slice(0, endIdx + 1);
    try {
      const parsed = JSON.parse(objStr) as { label: string; text: string };
      if (parsed.label && parsed.text) {
        newObjects.push(parsed);
      }
    } catch {
      // malformed, skip
    }

    // Move past this object + trailing comma
    remaining = trimmed.slice(endIdx + 1).replace(/^[\s,]*/, "");
  }

  return { newObjects, remaining };
}
