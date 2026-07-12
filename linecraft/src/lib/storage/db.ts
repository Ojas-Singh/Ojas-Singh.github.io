import Dexie, { type Table } from "dexie";
import type { StyleProfile } from "@/types/styleProfile";
import type { WritingProject } from "@/types/project";

export class LineCraftDB extends Dexie {
  styleProfiles!: Table<StyleProfile, string>;
  projects!: Table<WritingProject, string>;

  constructor() {
    super("linecraft-db");

    this.version(1).stores({
      styleProfiles: "id, name, createdAt, updatedAt",
      projects: "id, title, createdAt, updatedAt",
    });
  }
}

export const db = new LineCraftDB();
