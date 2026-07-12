export function extractJsonFromText(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
  }

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const start =
    firstBracket >= 0 && firstBracket < firstBrace ? firstBracket : firstBrace;

  if (start > 0) cleaned = cleaned.slice(start);

  return cleaned;
}

export function safeJsonParse<T>(text: string): T {
  const json = extractJsonFromText(text);
  try {
    return JSON.parse(json) as T;
  } catch {
    throw new Error(
      "Could not parse the model response as JSON. You can retry, or switch to another model."
    );
  }
}
