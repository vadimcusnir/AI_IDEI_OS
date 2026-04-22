/**
 * NeuronGrid — Grid of neuron cards for the Library page.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Brain, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { EmptyState } from "@/components/shared/EmptyState";

export interface NeuronItem {
  id: number;
  title: string;
  status: string;
  lifecycle: string;
  content_category: string | null;
  created_at: string;
  updated_at: string;
  number: number;
  blockPreview?: string;
}

interface NeuronGridProps {
  neurons: NeuronItem[];
  showHeader?: boolean;
  /** When true, suppress the empty state (parent will render its own). */
  hideEmpty?: boolean;
}

export function NeuronGrid({ neurons, showHeader, hideEmpty }: NeuronGridProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");

  if (neurons.length === 0) {
    if (hideEmpty) return null;
    return (
      <EmptyState
        tone="active"
        icon={Brain}
        title={t("library.no_neurons", { defaultValue: "No context data yet" })}
        description={t("library.no_neurons_hint", {
          defaultValue:
            "Context data are atomic knowledge units extracted from your uploads. Add an episode to generate your first neurons automatically.",
        })}
        actionLabel={t("library.go_to_extractor", { defaultValue: "Open Extractor" })}
        onAction={() => navigate("/extractor")}
      />
    );
  }

  return (
    <>
      {showHeader && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
          <Brain className="h-3 w-3" /> {t("library.context_data_label", { defaultValue: "Extracted neurons" })} ({neurons.length})
        </h3>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {neurons.map(neuron => (
          <div
            key={neuron.id}
            className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
            onClick={() => navigate(`/n/${neuron.number}`)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-nano font-mono uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {neuron.content_category || "neuron"}
                </span>
                <Badge variant="outline" className="text-nano font-mono">N{neuron.number}</Badge>
              </div>
              <span className={cn(
                "text-nano px-1.5 py-0.5 rounded-full font-medium",
                neuron.lifecycle === "validated" ? "bg-status-validated/10 text-status-validated" :
                neuron.lifecycle === "draft" ? "bg-muted text-muted-foreground" :
                "bg-status-active/10 text-status-active"
              )}>{neuron.lifecycle}</span>
            </div>
            <h4 className="text-sm font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {neuron.title}
            </h4>
            {neuron.blockPreview && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {neuron.blockPreview}
              </p>
            )}
            <div className="flex items-center gap-1 text-micro text-muted-foreground/70">
              <Clock className="h-2.5 w-2.5" />
              {format(new Date(neuron.updated_at), "dd MMM yyyy")}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
