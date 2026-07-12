import { v4 as uuid } from "uuid";
import type { RewriteCandidate } from "@/types/sentence";

export function extractJsonFromText(text: string): string {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const starts = [cleaned.indexOf("["), cleaned.indexOf("{")].filter((x) => x >= 0);
  if (!starts.length) return cleaned;
  const start = Math.min(...starts); const opener = cleaned[start]; const closer = opener === "[" ? "]" : "}";
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === opener) depth++;
    if (ch === closer && --depth === 0) return cleaned.slice(start, i + 1);
  }
  return cleaned.slice(start).replace(/,\s*([}\]])/g, "$1");
}

export function safeJsonParse<T>(text: string): T {
  const json = extractJsonFromText(text);
  const attempts = [json, json.replace(/,\s*([}\]])/g, "$1"), json.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")];
  for (const attempt of attempts) { try { return JSON.parse(attempt) as T; } catch { /* try repair */ } }
  throw new Error("The model returned an unreadable response. Retry once; LineCraft now accepts JSON, fenced JSON, and plain numbered alternatives.");
}

export function parseRewriteCandidates(text: string): RewriteCandidate[] {
  try {
    const parsed = safeJsonParse<unknown>(text);
    const raw = Array.isArray(parsed) ? parsed : typeof parsed === "object" && parsed ? ((parsed as Record<string, unknown>).candidates ?? (parsed as Record<string, unknown>).variants ?? [parsed]) : [];
    if (Array.isArray(raw)) {
      const candidates = raw.map(normalizeCandidate).filter((x): x is RewriteCandidate => x !== null);
      if (candidates.length) return candidates.slice(0, 5);
    }
  } catch { /* use readable-text fallback */ }

  // Conservative fallback: accept only an explicitly labelled, quoted rewrite.
  // Never turn arbitrary prose (including model reasoning) into a candidate.
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const labels = ["Clean professional", "Natural", "Stronger", "Simple", "Closest to my style"];
  const fallback: RewriteCandidate[] = [];
  const pattern = /(?:^|\n)\s*(?:\*\*)?(Clean professional|Natural|Stronger|Simple|Closest to my style)(?:\*\*)?\s*:\s*["“]([^"”\n]+)["”]/gi;
  for (const match of cleaned.matchAll(pattern)) {
    const label = labels.find((x) => x.toLowerCase() === match[1].toLowerCase()) ?? match[1];
    fallback.push({ id: uuid(), label, text: match[2].trim(), meaning: { risk: "medium", removedDetails: [], addedClaims: [], note: "Meaning assessment was not supplied by the model." } });
  }
  if (fallback.length) return fallback.slice(0, 5);
  throw new Error("The model did not return usable rewrite options. Please retry; internal model notes were hidden.");
}

function normalizeCandidate(value: unknown): RewriteCandidate | null {
  if (typeof value === "string") return { id: uuid(), label: "Option", text: value, meaning: { risk: "medium", removedDetails: [], addedClaims: [], note: "" } };
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>; const text = item.text ?? item.rewrite ?? item.content; if (typeof text !== "string" || !text.trim() || looksLikeReasoning(text)) return null;
  const meaning = item.meaning && typeof item.meaning === "object" ? item.meaning as Record<string, unknown> : {};
  const riskValue = meaning.risk ?? item.risk; const risk = riskValue === "low" || riskValue === "high" ? riskValue : "medium";
  return { id: uuid(), label: typeof item.label === "string" ? item.label : "Option", text: text.trim(), meaning: { risk, removedDetails: stringArray(meaning.removedDetails ?? item.removedDetails), addedClaims: stringArray(meaning.addedClaims ?? item.addedClaims), note: typeof meaning.note === "string" ? meaning.note : "" } };
}

function looksLikeReasoning(text: string): boolean {
  const sample = text.trim().slice(0, 500).toLowerCase();
  return sample.startsWith("we are asked to") || sample.startsWith("we need to") || sample.includes("return exactly five") || sample.includes("the original sentence says:");
}

function stringArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : typeof value === "string" && value ? [value] : []; }
