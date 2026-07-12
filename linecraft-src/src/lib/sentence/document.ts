import { v4 as uuid } from "uuid";
import type { ParagraphPurpose, SentenceBlock, SentenceProvenance, WritingDocument } from "@/types/sentence";
import { splitIntoSentences } from "./splitSentences";

export function emptyDocument(): WritingDocument {
  return { schemaVersion: 2, paragraphs: [] };
}

export function textToDocument(text: string, provenance: SentenceProvenance = "manual"): WritingDocument {
  const normalizedText = text.replace(/\r\n?/g, "\n");
  const paragraphs = normalizedText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return {
    schemaVersion: 2,
    rawText: normalizedText,
    paragraphs: paragraphs.map((text) => ({
      id: uuid(),
      purpose: "" as ParagraphPurpose,
      sentences: text.split("\n").flatMap((line) => splitIntoSentences(line)).map((sentence): SentenceBlock => ({
        id: uuid(), text: sentence, localContext: "", provenance,
      })),
    })),
  };
}

export function documentToText(document: WritingDocument): string {
  if (typeof document.rawText === "string") return document.rawText.replace(/\r\n?/g, "\n");
  return document.paragraphs
    .map((p) => p.sentences.map((s) => s.text.trim()).filter(Boolean).join(" "))
    .filter(Boolean).join("\n\n");
}

export function cloneDocument(document: WritingDocument): WritingDocument {
  return structuredClone(document);
}

export function findSentence(document: WritingDocument, sentenceId: string) {
  for (const paragraph of document.paragraphs) {
    const index = paragraph.sentences.findIndex((s) => s.id === sentenceId);
    if (index >= 0) return { paragraph, index, sentence: paragraph.sentences[index] };
  }
  return null;
}
