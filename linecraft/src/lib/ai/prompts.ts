import type { StyleProfile } from "@/types/styleProfile";

export function buildStyleExtractionPrompt(sampleText: string): string {
  return `Analyze the writing sample below and extract a reusable writing style profile.

Do not copy private content.
Do not summarize the topic.
Extract only style rules.

Return strict JSON with this shape:
{
  "name": "string",
  "voice": "string",
  "tone": "string",
  "sentenceRhythm": "string",
  "vocabularyHabits": ["string"],
  "rhetoricalHabits": ["string"],
  "directnessLevel": "soft | balanced | direct | very-direct",
  "typicalPhrases": ["string"],
  "avoidPhrases": ["string"],
  "rules": ["string"],
  "exampleTransformations": [
    {
      "generic": "string",
      "inUserStyle": "string"
    }
  ]
}

Writing sample:
${sampleText}`;
}

export function getStyleExtractionSystemMessage(): string {
  return "You extract reusable writing style profiles. Return only valid JSON. Do not include markdown.";
}

export function buildDraftPrompt(input: {
  styleProfile: Pick<StyleProfile, "voice" | "tone" | "sentenceRhythm" | "vocabularyHabits" | "rhetoricalHabits" | "typicalPhrases" | "avoidPhrases" | "rules">;
  targetFormat: string;
  audience: string;
  goal: string;
  rawContext: string;
  mustInclude: string;
  niceToInclude: string;
  doNotSay: string;
  evidence: string;
  toneOverride: string;
}): string {
  const style = [
    `Voice: ${input.styleProfile.voice}`,
    `Tone: ${input.styleProfile.tone}`,
    `Rhythm: ${input.styleProfile.sentenceRhythm}`,
    `Vocabulary: ${input.styleProfile.vocabularyHabits.join(", ")}`,
    `Rhetoric: ${input.styleProfile.rhetoricalHabits.join("; ")}`,
    `Typical phrases: ${input.styleProfile.typicalPhrases.join("; ")}`,
    `Avoid: ${input.styleProfile.avoidPhrases.join(", ")}`,
    `Rules: ${input.styleProfile.rules.join("; ")}`,
  ].join("\n");

  return `Write a complete first draft in the user's style.

Target format: ${input.targetFormat}
Audience: ${input.audience}
Goal: ${input.goal}

Style:
${style}

Tone override: ${input.toneOverride}

Context:
${input.rawContext}

Must include: ${input.mustInclude}
Nice to include: ${input.niceToInclude}
Do not say: ${input.doNotSay}
Evidence: ${input.evidence}

Rules:
- Preserve technical specificity. Do not invent facts.
- Avoid generic AI filler. Use the user's style.
- Prefer clear, direct writing.
- If context is messy, organize it logically.
- If info is missing, write around it rather than fabricating.
- Return only the draft text.`;
}

export function getDraftSystemMessage(): string {
  return "You are a writing assistant that writes in the user's personal style. You preserve context, avoid generic phrasing, and produce usable drafts.";
}

export function buildSentenceVariantsPrompt(input: {
  styleProfile: { voice: string; tone: string; sentenceRhythm: string; rules: string[] };
  paragraph: string;
  selectedText: string;
  extraContext?: string;
  projectContext?: {
    audience: string;
    goal: string;
    mustInclude: string;
    doNotSay: string;
  };
}): string {
  const projectCtx = input.projectContext
    ? `\nProject context (who this is for):\n- Audience: ${input.projectContext.audience || "unspecified"}\n- Goal: ${input.projectContext.goal || "unspecified"}\n- Must include: ${input.projectContext.mustInclude || "nothing specific"}\n- Do not say: ${input.projectContext.doNotSay || "nothing specific"}\n`
    : "";

  return `Rewrite only the selected text.

Style guidance:
- Voice: ${input.styleProfile.voice}
- Tone: ${input.styleProfile.tone}
- Rhythm: ${input.styleProfile.sentenceRhythm}
- Rules: ${input.styleProfile.rules.join("; ")}
${projectCtx}
Surrounding paragraph for context:
${input.paragraph}

Selected text to rewrite:
${input.selectedText}

Extra context:
${input.extraContext || "None"}

Generate 8 alternatives:
1. clearer
2. sharper
3. softer
4. more academic
5. more natural
6. more concise
7. more context-rich
8. closest to user's style

Rules:
- Rewrite only the selected text — do not rewrite the full paragraph.
- Do not change the meaning unless the extra context requires it.
- Preserve technical specificity.
- Avoid generic AI phrasing.
- Return strict JSON array with this shape:
[
  { "label": "clearer", "text": "..." },
  { "label": "sharper", "text": "..." }
]`;
}

export function getSentenceVariantsSystemMessage(): string {
  return "You generate rewrite options for a selected passage. Return only valid JSON. Do not include markdown.";
}

export function buildParagraphRewritePrompt(input: {
  styleProfile: Pick<StyleProfile, "voice" | "tone" | "sentenceRhythm" | "rules">;
  paragraph: string;
  instruction: string;
}): string {
  const style = [
    `Voice: ${input.styleProfile.voice}`,
    `Tone: ${input.styleProfile.tone}`,
    `Rhythm: ${input.styleProfile.sentenceRhythm}`,
    `Rules: ${input.styleProfile.rules.join("; ")}`,
  ].join("\n");

  return `Rewrite this paragraph according to the instruction.

Style:
${style}

Instruction: ${input.instruction}

Paragraph:
${input.paragraph}

Rules:
- Preserve meaning and important context.
- Avoid generic AI phrasing.
- Return only the rewritten paragraph.`;
}

export function getParagraphRewriteSystemMessage(): string {
  return "You rewrite paragraphs to match specific instructions. Return only the rewritten text.";
}
