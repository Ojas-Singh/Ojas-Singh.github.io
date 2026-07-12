export type StyleProfile = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  voice: string;
  tone: string;
  sentenceRhythm: string;
  vocabularyHabits: string[];
  rhetoricalHabits: string[];
  directnessLevel: "soft" | "balanced" | "direct" | "very-direct";
  typicalPhrases: string[];
  avoidPhrases: string[];
  rules: string[];
  exampleTransformations: {
    generic: string;
    inUserStyle: string;
  }[];
};
