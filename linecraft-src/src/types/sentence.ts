export type SentenceProvenance = "generated" | "pasted" | "manual" | "rewrite";
export type ParagraphPurpose = "" | "Context" | "Problem" | "Request" | "Justification" | "Evidence" | "Conclusion";

export type MeaningAssessment = {
  risk: "low" | "medium" | "high";
  removedDetails: string[];
  addedClaims: string[];
  note: string;
};

export type RewriteIntent = "simpler" | "shorter" | "detailed" | "natural" | "confident" | "technical" | "options";
export type RewriteFreedom = "safe" | "balanced" | "bold";

export type RewriteCandidate = {
  id: string;
  label: string;
  text: string;
  meaning: MeaningAssessment;
};

/** @deprecated Control-room candidates use RewriteCandidate. */
export type SentenceVariant = { id: string; label: string; text: string };

export type SentenceFeedback = {
  id: string;
  sentenceId: string;
  candidateText: string;
  reason: string;
  createdAt: string;
};

export type SentenceBlock = {
  id: string;
  text: string;
  localContext: string;
  provenance: SentenceProvenance;
  lastAcceptedRewrite?: string;
};

export type ParagraphBlock = {
  id: string;
  purpose: ParagraphPurpose;
  sentences: SentenceBlock[];
};

export type WritingDocument = {
  schemaVersion: 2;
  paragraphs: ParagraphBlock[];
  rawText?: string;
};
