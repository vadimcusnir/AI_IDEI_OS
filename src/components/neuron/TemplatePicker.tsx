import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Sparkles, BarChart3, Briefcase, Plus, Loader2, X,
  BookOpen, Pen, Megaphone, Brain, Layers
} from "lucide-react";
import { useNeuronTemplates, NeuronTemplate } from "@/hooks/useNeuronTemplates";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Codul Cușnir": Pen,
  research: FileText,
  ai: Sparkles,
  analysis: BarChart3,
  business: Briefcase,
  copywriting: Pen,
  marketing: Megaphone,
  general: BookOpen,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Codul Cușnir": "text-primary",
  research: "text-status-validated",
  ai: "text-ai-accent",
  analysis: "text-primary",
  business: "text-graph-highlight",
  copywriting: "text-primary",
  marketing: "text-ai-accent",
  general: "text-muted-foreground",
};

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatePicker({ isOpen, onClose }: TemplatePickerProps) {
  const navigate = useNavigate();
  const { templates, loading, fetchTemplates, createFromTemplate } = useNeuronTemplates();
  const [creating, setCreating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (isOpen) fetchTemplates();
  }, [isOpen, fetchTemplates]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return ["all", ...Array.from(cats)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (activeTab === "all") return templates;
    return templates.filter(t => t.category === activeTab);
  }, [templates, activeTab]);

  const handleUseTemplate = async (template: NeuronTemplate) => {
    setCreating(template.id);
    const neuron = await createFromTemplate(template.id);
    setCreating(null);
    if (neuron) {
      onClose();
      navigate(`/n/${neuron.number}`);
    }
  };

  const handleBlank = () => {
    onClose();
    navigate("/n/new");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base">Create Neuron</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Start from scratch or use a template
              {templates.length > 0 && <span className="text-muted-foreground/40"> · {templates.length} templates</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Blank option */}
        <div className="px-5 pt-4 shrink-0">
          <button
            onClick={handleBlank}
            className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">Blank Neuron</div>
              <div className="text-micro text-muted-foreground">Start with an empty document</div>
            </div>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => {
              const CatIcon = cat === "all" ? Layers : (CATEGORY_ICONS[cat] || FileText);
              const isActive = activeTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-dense font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <CatIcon className="h-3 w-3" />
                  <span className="capitalize">{cat === "all" ? "All" : cat}</span>
                  {cat !== "all" && (
                    <span className="text-nano text-muted-foreground/50">
                      {templates.filter(t => t.category === cat).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates (scrollable) */}
        <div className="px-5 pb-5 overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">No templates in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredTemplates.map(tpl => {
                const Icon = CATEGORY_ICONS[tpl.category] || FileText;
                const color = CATEGORY_COLORS[tpl.category] || "text-muted-foreground";
                const isCreating = creating === tpl.id;

                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleUseTemplate(tpl)}
                    disabled={!!creating}
                    className="flex items-start gap-2.5 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left disabled:opacity-50 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      {isCreating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{tpl.name}</div>
                      <div className="text-micro text-muted-foreground line-clamp-2 leading-tight mt-0.5">{tpl.description}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-nano text-muted-foreground/60">{tpl.blocks_template.length} blocks</span>
                        {tpl.usage_count > 0 && (
                          <span className="text-nano text-muted-foreground/60">· {tpl.usage_count} uses</span>
                        )}
                        <span className="text-nano text-muted-foreground/40 capitalize">· {tpl.category}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
