import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Sparkles, BarChart3, Briefcase, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNeuronTemplates, NeuronTemplate } from "@/hooks/useNeuronTemplates";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  research: FileText,
  ai: Sparkles,
  analysis: BarChart3,
  business: Briefcase,
};

const CATEGORY_COLORS: Record<string, string> = {
  research: "text-status-validated",
  ai: "text-ai-accent",
  analysis: "text-primary",
  business: "text-graph-highlight",
};

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatePicker({ isOpen, onClose }: TemplatePickerProps) {
  const navigate = useNavigate();
  const { templates, loading, fetchTemplates, createFromTemplate } = useNeuronTemplates();
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchTemplates();
  }, [isOpen, fetchTemplates]);

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
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-serif">Create Neuron</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Start from scratch or use a template</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Blank option */}
        <div className="px-5 pt-4">
          <button
            onClick={handleBlank}
            className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">Blank Neuron</div>
              <div className="text-[10px] text-muted-foreground">Start with an empty document</div>
            </div>
          </button>
        </div>

        {/* Templates */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Templates</p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {templates.map(tpl => {
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
                    <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors`}>
                      {isCreating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{tpl.name}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">{tpl.description}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9px] text-muted-foreground/60">{tpl.blocks_template.length} blocks</span>
                        {tpl.usage_count > 0 && (
                          <span className="text-[9px] text-muted-foreground/60">· {tpl.usage_count} uses</span>
                        )}
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
