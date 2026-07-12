import { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash2, CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import type { StyleProfile } from "@/types/styleProfile";
import {
  getAllStyleProfiles,
  saveStyleProfile,
  updateStyleProfile,
  deleteStyleProfile,
} from "@/lib/storage/styleProfiles";
import { DEFAULT_DIRECT_ACADEMIC } from "@/data/defaultStyleProfiles";
import { getApiKey, getSettings } from "@/lib/storage/settings";
import { callOpenCodeGo } from "@/lib/ai/opencodeGo";
import {
  buildStyleExtractionPrompt,
  getStyleExtractionSystemMessage,
} from "@/lib/ai/prompts";
import { safeJsonParse } from "@/lib/ai/json";
import { WritingSampleUploader } from "./WritingSampleUploader";
import { StyleProfileEditor } from "./StyleProfileEditor";

type Props = {
  activeProfileId: string | null;
  onSelectProfile: (id: string) => void;
};

export function StyleProfilePanel({ activeProfileId, onSelectProfile }: Props) {
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(activeProfileId);
  const [sampleText, setSampleText] = useState("");
  const [editingProfile, setEditingProfile] = useState<StyleProfile | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const all = await getAllStyleProfiles();
    if (all.length === 0) {
      await saveStyleProfile(DEFAULT_DIRECT_ACADEMIC);
      const reloaded = await getAllStyleProfiles();
      setProfiles(reloaded);
      const first = reloaded[0]?.id;
      if (first) {
        setSelectedId(first);
        onSelectProfile(first);
      }
    } else {
      setProfiles(all);
      if (!selectedId || !all.find((p) => p.id === selectedId)) {
        const first = all[0]?.id;
        if (first) {
          setSelectedId(first);
          onSelectProfile(first);
        }
      }
    }
  };

  const selected = profiles.find((p) => p.id === selectedId) ?? null;

  const handleExtract = useCallback(async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("Please configure your API key in Settings first.");
      return;
    }
    if (!sampleText.trim()) {
      setError("Please paste or upload a writing sample first.");
      return;
    }

    setExtracting(true);
    setError("");

    try {
      const settings = getSettings();
      const content = await callOpenCodeGo({
        apiKey,
        model: settings.selectedModel,
        temperature: 0.3,
        messages: [
          { role: "system", content: getStyleExtractionSystemMessage() },
          { role: "user", content: buildStyleExtractionPrompt(sampleText.trim()) },
        ],
      });

      const parsed = safeJsonParse<StyleProfile>(content);
      const saved = await saveStyleProfile(parsed);
      await loadProfiles();
      setSelectedId(saved.id);
      onSelectProfile(saved.id);
      setSampleText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Style extraction failed. Please try again.");
    } finally {
      setExtracting(false);
    }
  }, [sampleText]);

  const handleDelete = async (id: string) => {
    await deleteStyleProfile(id);
    await loadProfiles();
    if (selectedId === id) setSelectedId(profiles[0]?.id ?? null);
  };

  const handleSaveEdit = async () => {
    if (!editingProfile) return;
    setSaving(true);
    try {
      if (editingProfile.id && profiles.some((p) => p.id === editingProfile.id)) {
        await updateStyleProfile(editingProfile.id, editingProfile);
      } else {
        await saveStyleProfile(editingProfile);
      }
      await loadProfiles();
      setEditingProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Capture Your Voice</h2>
        <p className="text-sm text-ink-secondary mt-1">
          Paste writing samples to extract your style. The AI learns your voice, tone, and rhythm.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            Active Profile
          </span>
          <button
            onClick={() =>
              setEditingProfile({
                id: "",
                name: "New Profile",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                voice: "",
                tone: "",
                sentenceRhythm: "",
                vocabularyHabits: [],
                rhetoricalHabits: [],
                directnessLevel: "direct",
                typicalPhrases: [],
                preferredPhrases: [],
                avoidPhrases: [],
                rules: [],
                exampleTransformations: [],
              })
            }
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
                       bg-white border border-line text-ink-secondary hover:text-ink
                       hover:border-line-hover transition-all"
          >
            <Plus className="w-3 h-3" />
            New
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedId(p.id);
                onSelectProfile(p.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150
                ${
                  p.id === selectedId
                    ? "bg-brand-600 text-white border border-brand-600 shadow-sm shadow-brand-600/20"
                    : "bg-white border border-line text-ink-secondary hover:border-line-hover hover:text-ink"
                }`}
            >
              {p.id === selectedId && <CheckCircle className="w-3.5 h-3.5" />}
              {p.name}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProfile(p);
                }}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
              >
                <Edit3 className="w-3 h-3" />
              </span>
              {p.id !== DEFAULT_DIRECT_ACADEMIC.id && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="opacity-60 hover:opacity-100 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {editingProfile ? (
        <div className="p-6 rounded-2xl border border-line bg-card shadow-sm">
          <StyleProfileEditor
            profile={editingProfile}
            onChange={setEditingProfile}
            onSave={handleSaveEdit}
            onCancel={() => setEditingProfile(null)}
            saving={saving}
          />
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-line bg-card shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-1">Extract from Samples</h3>
          <p className="text-xs text-ink-muted mb-4">
            Upload a file or paste a paragraph of your writing. The AI extracts only style rules — not content.
          </p>
          <WritingSampleUploader
            sampleText={sampleText}
            onSampleChange={setSampleText}
            onExtract={handleExtract}
            loading={extracting}
          />
        </div>
      )}

      {selected && !editingProfile && (
        <div className="p-6 rounded-2xl border border-line bg-card shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-ink">{selected.name}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Field label="Voice" value={selected.voice} />
            <Field label="Tone" value={selected.tone} />
            <Field label="Sentence Rhythm" value={selected.sentenceRhythm} />
            <Field label="Directness" value={selected.directnessLevel} />
          </div>
          <TagList label="Vocabulary Habits" items={selected.vocabularyHabits} />
          <TagList label="Rhetorical Habits" items={selected.rhetoricalHabits} />
          <TagList label="Typical Phrases" items={selected.typicalPhrases} />
          <TagList label="Phrases to Avoid" items={selected.avoidPhrases} />
          {selected.rules.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Rules</span>
              <ul className="mt-2 space-y-1">
                {selected.rules.map((r, i) => (
                  <li key={i} className="text-sm text-ink-secondary flex gap-2">
                    <span className="text-brand-400">—</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</span>
      <p className="text-ink mt-1">{value}</p>
    </div>
  );
}

function TagList({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-md bg-inset border border-line text-xs text-ink-secondary"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
