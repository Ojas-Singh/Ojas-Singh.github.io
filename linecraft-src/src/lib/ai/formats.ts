export const FORMATS = [
  "Email",
  "Academic paragraph",
  "Reviewer comment",
  "LinkedIn post",
  "Paper section",
  "Thesis paragraph",
  "Grant text",
  "Reply message",
  "General document",
] as const;

export type TargetFormat = (typeof FORMATS)[number];
