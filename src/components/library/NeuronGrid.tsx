/**
 * NeuronGrid — Grid of neuron cards for the Library page.
 */
import { useNavigate } from "react-router-dom";
import { Brain, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
}

export function NeuronGrid({ neurons, showHeader }: NeuronGridProps) {
  const navigate = useNavigate();

  if (neurons.length === 0) return null;

  return (
    <>
      {showHeader && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
          <Brain className="h-3 w-3" /> Neuroni extrași ({neurons.length})
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
                <Badge variant="outline" className="text-nano">#{neuron.number}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn("h-1.5 w-1.5 rounded-full", neuron.status === "published" ? "bg-status-validated" : "bg-muted-foreground/40")} />
                <span className="text-nano text-muted-foreground">{neuron.status}</span>
              </div>
            </div>
            <h3 className="text-sm font-medium mb-1.5 line-clamp-2">{neuron.title}</h3>
            {neuron.blockPreview && (
              <p className="text-dense text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                {neuron.blockPreview}
              </p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-nano text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {format(new Date(neuron.updated_at), "dd MMM yyyy")}
              </span>
              <span className="text-nano text-muted-foreground/60">{neuron.lifecycle}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
