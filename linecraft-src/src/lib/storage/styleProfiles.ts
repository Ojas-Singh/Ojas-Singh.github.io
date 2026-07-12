import { v4 as uuid } from "uuid";
import { db } from "./db";
import type { StyleProfile } from "@/types/styleProfile";

export async function getAllStyleProfiles(): Promise<StyleProfile[]> {
  return db.styleProfiles.orderBy("updatedAt").reverse().toArray();
}

export async function getStyleProfile(id: string): Promise<StyleProfile | undefined> {
  return db.styleProfiles.get(id);
}

export async function saveStyleProfile(
  profile: Omit<StyleProfile, "id" | "createdAt" | "updatedAt"> & Partial<Pick<StyleProfile, "id" | "createdAt">>
): Promise<StyleProfile> {
  const now = new Date().toISOString();
  const record: StyleProfile = {
    id: profile.id ?? uuid(),
    createdAt: profile.createdAt ?? now,
    updatedAt: now,
    name: profile.name,
    voice: profile.voice,
    tone: profile.tone,
    sentenceRhythm: profile.sentenceRhythm,
    vocabularyHabits: profile.vocabularyHabits,
    rhetoricalHabits: profile.rhetoricalHabits,
    directnessLevel: profile.directnessLevel,
    typicalPhrases: profile.typicalPhrases,
    preferredPhrases: profile.preferredPhrases ?? profile.typicalPhrases ?? [],
    avoidPhrases: profile.avoidPhrases,
    rules: profile.rules,
    exampleTransformations: profile.exampleTransformations,
  };
  await db.styleProfiles.put(record);
  return record;
}

export async function updateStyleProfile(
  id: string,
  updates: Partial<Omit<StyleProfile, "id" | "createdAt">>
): Promise<StyleProfile | undefined> {
  const existing = await db.styleProfiles.get(id);
  if (!existing) return undefined;

  const updated: StyleProfile = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await db.styleProfiles.put(updated);
  return updated;
}

export async function deleteStyleProfile(id: string): Promise<void> {
  await db.styleProfiles.delete(id);
}
