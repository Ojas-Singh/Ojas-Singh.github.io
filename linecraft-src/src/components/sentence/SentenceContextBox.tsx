import { useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (context: string) => void;
  onClose: () => void;
};

export function SentenceContextBox({ value, onChange, onClose }: Props) {
  const [local, setLocal] = useState(value);

  return (
    <div className="p-3 rounded-xl border border-brand-200 bg-brand-50/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MessageSquarePlus className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-xs font-medium text-brand-700">Extra context for this passage</span>
        </div>
        <button onClick={onClose} className="text-ink-muted hover:text-ink">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local)}
        placeholder="Add specific context for this passage only…"
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-white border border-line
                   text-ink placeholder-ink-muted text-xs resize-y
                   focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 transition-all"
      />
    </div>
  );
}
