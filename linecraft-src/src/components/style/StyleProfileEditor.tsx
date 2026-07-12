import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import type { StyleProfile } from "@/types/styleProfile";
import { Button } from "@/components/ui/Button";

type Props = {
  profile: StyleProfile;
  onChange: (updated: StyleProfile) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
};

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-inset border border-line text-ink text-sm " +
  "placeholder-ink-muted transition-all " +
  "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15";

const labelClass =
  "text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1.5";

export function StyleProfileEditor({ profile, onChange, onSave, onCancel, saving }: Props) {
  const [local, setLocal] = useState<StyleProfile>(profile);

  useEffect(() => {
    setLocal(profile);
  }, [profile]);

  const update = (partial: Partial<StyleProfile>) => {
    const next = { ...local, ...partial, updatedAt: new Date().toISOString() };
    setLocal(next);
    onChange(next);
  };

  const updateList = (key: keyof StyleProfile, value: string) => {
    const arr = (local[key] as string[]).filter(Boolean);
    update({ [key]: [...arr, value] } as Partial<StyleProfile>);
  };

  const removeListItem = (key: keyof StyleProfile, index: number) => {
    const arr = [...(local[key] as string[])];
    arr.splice(index, 1);
    update({ [key]: arr } as Partial<StyleProfile>);
  };

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Profile Name</label>
        <input
          value={local.name}
          onChange={(e) => update({ name: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Overall Voice</label>
        <textarea
          value={local.voice}
          onChange={(e) => update({ voice: e.target.value })}
          rows={2}
          className={`${inputClass} resize-y`}
        />
      </div>

      <div>
        <label className={labelClass}>Tone</label>
        <input
          value={local.tone}
          onChange={(e) => update({ tone: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Sentence Rhythm</label>
        <input
          value={local.sentenceRhythm}
          onChange={(e) => update({ sentenceRhythm: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Directness Level</label>
        <select
          value={local.directnessLevel}
          onChange={(e) =>
            update({ directnessLevel: e.target.value as StyleProfile["directnessLevel"] })
          }
          className={inputClass}
        >
          <option value="soft">Soft</option>
          <option value="balanced">Balanced</option>
          <option value="direct">Direct</option>
          <option value="very-direct">Very Direct</option>
        </select>
      </div>

      <ListSection title="Vocabulary Habits" items={local.vocabularyHabits} onAdd={(v) => updateList("vocabularyHabits", v)} onRemove={(i) => removeListItem("vocabularyHabits", i)} />
      <ListSection title="Rhetorical Habits" items={local.rhetoricalHabits} onAdd={(v) => updateList("rhetoricalHabits", v)} onRemove={(i) => removeListItem("rhetoricalHabits", i)} />
      <ListSection title="Typical Phrases" items={local.typicalPhrases} onAdd={(v) => updateList("typicalPhrases", v)} onRemove={(i) => removeListItem("typicalPhrases", i)} />
      <ListSection title="Preferred Phrases" items={local.preferredPhrases ?? []} onAdd={(v) => updateList("preferredPhrases", v)} onRemove={(i) => removeListItem("preferredPhrases", i)} />
      <ListSection title="Phrases to Avoid" items={local.avoidPhrases} onAdd={(v) => updateList("avoidPhrases", v)} onRemove={(i) => removeListItem("avoidPhrases", i)} />
      <ListSection title="Style Rules" items={local.rules} onAdd={(v) => updateList("rules", v)} onRemove={(i) => removeListItem("rules", i)} />

      <div className="flex gap-2 pt-2">
        <Button variant="primary" onClick={onSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Profile"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ListSection({
  title,
  items,
  onAdd,
  onRemove,
}: {
  title: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed) {
      onAdd(trimmed);
      setInput("");
    }
  };

  return (
    <div>
      <label className={labelClass}>{title}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-inset
                       border border-line text-xs text-ink-secondary"
          >
            {item}
            <button
              onClick={() => onRemove(i)}
              className="text-ink-muted hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={`Add ${title.toLowerCase()}…`}
          className="flex-1 px-3 py-1.5 rounded-lg bg-inset border border-line
                     text-ink text-sm placeholder-ink-muted transition-all
                     focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
        />
        <Button variant="secondary" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
}
