import { v4 as uuid } from "uuid";
import { db } from "./db";
import type { WritingProject, DraftVersion } from "@/types/project";
import type { WritingDocument } from "@/types/sentence";
import { cloneDocument, emptyDocument } from "@/lib/sentence/document";

export async function getAllProjects(): Promise<WritingProject[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function getProject(id: string): Promise<WritingProject | undefined> {
  return db.projects.get(id);
}

export async function createProject(
  data: Partial<WritingProject> & { title: string }
): Promise<WritingProject> {
  const now = new Date().toISOString();
  const project: WritingProject = {
    id: uuid(),
    title: data.title,
    createdAt: now,
    updatedAt: now,
    targetFormat: data.targetFormat ?? "",
    audience: data.audience ?? "",
    goal: data.goal ?? "",
    rawContext: data.rawContext ?? "",
    mustInclude: data.mustInclude ?? "",
    niceToInclude: data.niceToInclude ?? "",
    doNotSay: data.doNotSay ?? "",
    evidence: data.evidence ?? "",
    toneOverride: data.toneOverride ?? "",
    selectedStyleProfileId: data.selectedStyleProfileId ?? null,
    document: data.document ?? emptyDocument(),
    versions: data.versions ?? [],
    feedback: data.feedback ?? [],
  };
  await db.projects.put(project);
  return project;
}

export async function updateProject(
  id: string,
  updates: Partial<WritingProject>
): Promise<WritingProject | undefined> {
  const existing = await db.projects.get(id);
  if (!existing) return undefined;

  const updated: WritingProject = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await db.projects.put(updated);
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export function createVersion(name: string, document: WritingDocument, action: DraftVersion["action"] = "manual"): DraftVersion {
  return {
    id: uuid(),
    name,
    createdAt: new Date().toISOString(),
    document: cloneDocument(document),
    action,
  };
}
