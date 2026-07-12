export type DiffPart = { value: string; kind: "same" | "added" | "removed" };

export function findPhraseMatches(text: string, phrases: string[]): string[] {
  const lower = text.toLocaleLowerCase();
  return [...new Set(phrases.map((p) => p.trim()).filter((p) => p && lower.includes(p.toLocaleLowerCase())))];
}

export function wordDiff(before: string, after: string): DiffPart[] {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffPart[] = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { out.push({ value: a[i], kind: "same" }); i++; j++; }
    else if (j < b.length && (i === a.length || dp[i][j + 1] >= dp[i + 1][j])) { out.push({ value: b[j++], kind: "added" }); }
    else { out.push({ value: a[i++], kind: "removed" }); }
  }
  return out;
}
