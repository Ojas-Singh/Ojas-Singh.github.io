import { useState } from "react";
import { Check, Edit3, RotateCcw, Save, Trash2, X } from "lucide-react";
import type { WritingDocument } from "@/types/sentence";
import type { DraftVersion, WritingProject } from "@/types/project";
import { createVersion, updateProject } from "@/lib/storage/projects";
import { documentToText } from "@/lib/sentence/document";

type Props = { project: WritingProject; document: WritingDocument; onRestoreVersion: (document: WritingDocument) => void; onProjectChange: (p: WritingProject) => void };
export function VersionPanel({ project, document, onRestoreVersion, onProjectChange }: Props) {
  const [renaming, setRenaming] = useState<string | null>(null); const [name, setName] = useState("");
  const save = async () => { if (!documentToText(document)) return; const v = createVersion(`v${project.versions.length + 1} — Saved`, document); const p = await updateProject(project.id, { versions: [...project.versions, v] }); if (p) onProjectChange(p); };
  const remove = async (id: string) => { const p = await updateProject(project.id, { versions: project.versions.filter((v) => v.id !== id) }); if (p) onProjectChange(p); };
  const rename = async () => { const p = await updateProject(project.id, { versions: project.versions.map((v) => v.id === renaming ? { ...v, name } : v) }); if (p) onProjectChange(p); setRenaming(null); };
  return <div className="space-y-3"><button onClick={save} className="w-full flex justify-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-brand-600 text-white"><Save className="w-3.5 h-3.5"/>Save current snapshot</button><div className="max-h-72 overflow-y-auto space-y-1.5">{[...project.versions].reverse().map((v: DraftVersion) => <div key={v.id} className="group flex items-center gap-2 p-2 rounded-lg border border-line text-xs">{renaming === v.id ? <><input value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1 border rounded px-1"/><button onClick={rename}><Check className="w-3 h-3"/></button><button onClick={() => setRenaming(null)}><X className="w-3 h-3"/></button></> : <><div className="min-w-0 flex-1"><p className="truncate">{v.name}</p><p className="text-[10px] text-ink-muted">{v.action} · {new Date(v.createdAt).toLocaleString()}</p></div><button onClick={() => { setRenaming(v.id); setName(v.name); }}><Edit3 className="w-3 h-3"/></button><button onClick={() => onRestoreVersion(v.document)}><RotateCcw className="w-3 h-3 text-brand-600"/></button><button onClick={() => remove(v.id)}><Trash2 className="w-3 h-3 text-red-500"/></button></>}</div>)}</div></div>;
}
