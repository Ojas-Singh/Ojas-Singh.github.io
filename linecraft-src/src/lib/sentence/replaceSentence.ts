export function replaceFirstOccurrence(
  fullText: string,
  oldSentence: string,
  newSentence: string
): string {
  const trimmed = oldSentence.trim();
  if (!trimmed) return fullText;

  const index = fullText.indexOf(trimmed);
  if (index === -1) return fullText;

  return fullText.slice(0, index) + newSentence + fullText.slice(index + trimmed.length);
}
