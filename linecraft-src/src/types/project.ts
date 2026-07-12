import type { SentenceFeedback, WritingDocument } from "./sentence";

export type VersionAction = "generated" | "edited" | "moved" | "deleted" | "inserted" | "rewrite" | "manual" | "restored";

export type DraftVersion = {
  id: string;
  name: string;
  createdAt: string;
  document: WritingDocument;
  action: VersionAction;
};

export type WritingProject = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  targetFormat: string;
  audience: string;
  goal: string;
  rawContext: string;
  mustInclude: string;
  niceToInclude: string;
  doNotSay: string;
  evidence: string;
  toneOverride: string;
  selectedStyleProfileId: string | null;
  document: WritingDocument;
  versions: DraftVersion[];
  feedback: SentenceFeedback[];
};
