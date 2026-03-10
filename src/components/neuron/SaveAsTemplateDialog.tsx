import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Block } from "./types";

interface SaveAsTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, category: string, blocks: any[], isPublic: boolean) => Promise<any>;
  blocks: Block[];
  defaultName?: string;
}

const CATEGORIES = [
  { value: "research", label: "Research" },
  { value: "ai", label: "AI / Prompts" },
  { value: "analysis", label: "Analysis" },
  { value: "business", label: "Business" },
  { value: "general", label: "General" },
];

export function SaveAsTemplateDialog({ isOpen, onClose, onSave, blocks, defaultName }: SaveAsTemplateDialogProps) {
  const [name, setName] = useState(defaultName || "");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const blocksTemplate = blocks.map(b => ({
      type: b.type,
      content: b.content,
      language: b.language,
      execution_mode: b.executionMode,
    }));
    await onSave(name, description, category, blocksTemplate, isPublic);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-serif font-medium">Save as Template</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Template name..."
              className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this template for..."
              rows={2}
              className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm outline-none border border-border focus:border-primary transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    category === c.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`h-4 w-8 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`h-3 w-3 rounded-full bg-card transition-transform ${isPublic ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
            <span className="text-xs text-muted-foreground">Public template</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {blocks.length} block{blocks.length !== 1 ? "s" : ""} will be saved as template structure.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving} className="text-xs gap-1.5">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save Template
          </Button>
        </div>
      </div>
    </div>
  );
}
