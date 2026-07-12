export type DraftVersion = {
  id: string;
  name: string;
  createdAt: string;
  text: string;
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

  currentDraft: string;
  versions: DraftVersion[];
};
