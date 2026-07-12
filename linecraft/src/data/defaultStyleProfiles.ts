import type { StyleProfile } from "@/types/styleProfile";

export const DEFAULT_DIRECT_ACADEMIC: StyleProfile = {
  id: "direct-academic",
  name: "Direct Academic",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  voice: "Direct, analytical, and technically specific.",
  tone: "Serious, clear, and critical when needed.",
  sentenceRhythm: "Medium-length sentences with clear claims followed by explanation.",
  vocabularyHabits: [
    "central issue",
    "not sufficiently justified",
    "the bigger problem",
    "does not clearly explain",
    "this matters because",
  ],
  rhetoricalHabits: [
    "States the main issue first",
    "Explains why the issue matters",
    "Uses concrete technical context",
    "Avoids excessive politeness or generic praise",
  ],
  directnessLevel: "direct",
  typicalPhrases: [
    "The central issue is",
    "The bigger problem is",
    "This is important because",
    "In its current form",
  ],
  avoidPhrases: [
    "It is worth noting",
    "Furthermore",
    "Groundbreaking",
    "Delve",
    "Leverage",
    "Robust framework",
  ],
  rules: [
    "Prefer specific claims over generic commentary.",
    "Do not over-polish.",
    "Do not add empty balancing statements.",
    "Keep the user's technical context intact.",
  ],
  exampleTransformations: [
    {
      generic: "The method could be improved by adding more explanation.",
      inUserStyle:
        "The method needs a clearer justification, especially because the current explanation does not show why this level of complexity is necessary.",
    },
  ],
};
