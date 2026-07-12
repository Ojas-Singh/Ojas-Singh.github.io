import { useState } from "react";
import { Check, Copy, Wand2 } from "lucide-react";
import type { SentenceVariant } from "@/types/sentence";

type Props = {
  label: string;
  text: string;
  onAccept: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  index?: number;
};

export function VariantPicker({ label, text, onAccept, onCopy, onRegenerate, index = 0 }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="stagger-item p-3.5 rounded-xl border border-line bg-white hover:border-brand-300
                 hover:shadow-sm transition-all duration-150"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
          {label}
        </span>
        <button
          onClick={onRegenerate}
          className="text-ink-muted hover:text-brand-600 transition-colors"
          title="Regenerate this variant"
        >
          <Wand2 className="w-3 h-3" />
        </button>
      </div>
      <p className="text-sm text-ink leading-relaxed font-draft mb-3">{text}</p>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium
                     bg-brand-600 text-white hover:bg-brand-500 transition-colors"
        >
          <Check className="w-3 h-3" />
          Accept
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium
                     bg-inset text-ink-secondary hover:bg-line border border-line
                     transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function VariantList({
  variants,
  onAccept,
  onRegenerate,
}: {
  variants: SentenceVariant[];
  onAccept: (variant: SentenceVariant) => void;
  onRegenerate: (label: string) => void;
}) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-line">
      <p className="text-xs text-ink-muted pt-2">
        Click <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-brand-600 text-white"><Check className="w-2.5 h-2.5" />Accept</span> to replace the selection.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {variants.map((v, i) => (
          <VariantPicker
            key={v.id}
            index={i}
            label={v.label}
            text={v.text}
            onAccept={() => onAccept(v)}
            onCopy={() => navigator.clipboard.writeText(v.text)}
            onRegenerate={() => onRegenerate(v.label)}
          />
        ))}
      </div>
    </div>
  );
}
