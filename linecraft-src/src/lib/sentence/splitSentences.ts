export function splitIntoSentences(text: string): string[] {
  const protectedText = text
    .replace(/\be\.g\./gi, "e§g§")
    .replace(/\bi\.e\./gi, "i§e§")
    .replace(/\bDr\./g, "Dr§")
    .replace(/\bProf\./g, "Prof§")
    .replace(/\bet al\./gi, "et al§");

  const sentences = protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) =>
      s
        .replace(/e§g§/gi, "e.g.")
        .replace(/i§e§/gi, "i.e.")
        .replace(/Dr§/g, "Dr.")
        .replace(/Prof§/g, "Prof.")
        .replace(/et al§/gi, "et al.")
        .trim()
    )
    .filter(Boolean);

  if (sentences.length === 0 && text.trim()) {
    return [text.trim()];
  }

  return sentences;
}
