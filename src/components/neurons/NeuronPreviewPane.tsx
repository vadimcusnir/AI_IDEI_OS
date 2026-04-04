import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, ExternalLink, Loader2, Zap, Tag, Clock, Brain, Lightbulb, Layers, Network, MessageSquareQuote, Target, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NeuronListItem } from "@/hooks/useNeuronList";

const CATEGORY_BADGE: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  insight: { icon: Lightbulb, color: "text-amber-500 bg-amber-500/10", label: "Insight" },
  framework: { icon: Layers, color: "text-blue-500 bg-blue-500/10", label: "Framework" },
  pattern: { icon: Network, color: "text-purple-500 bg-purple-500/10", label: "Pattern" },
  narrative: { icon: MessageSquareQuote, color: "text-emerald-500 bg-emerald-500/10", label: "Narrative" },
  commercial: { icon: Target, color: "text-rose-500 bg-rose-500/10", label: "Commercial" },
  psychological: { icon: Brain, color: "text-pink-500 bg-pink-500/10", label: "Psychological" },
  strategy: { icon: Boxes, color: "text-cyan-500 bg-cyan-500/10", label: "Strategy" },
};

interface Block {
  id: string;
  type: string;
  content: string;
  position: number;
}

interface Props {
  neuron: NeuronListItem;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  published: "bg-status-validated/15 text-status-validated",
  archived: "bg-muted text-muted-foreground/60",
};

export function NeuronPreviewPane({ neuron, onClose }: Props) {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("neuron_blocks")
        .select("id, type, content, position")
        .eq("neuron_id", neuron.id)
        .order("position", { ascending: true })
        .limit(20);
      setBlocks((data as Block[]) || []);
      setLoading(false);
    };
    load();
  }, [neuron.id]);

  const totalChars = blocks.reduce((s, b) => s + b.content.length, 0);
  const blockTypes = [...new Set(blocks.map(b => b.type))];

  return (
    <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col shrink-0 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Zap className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-mono text-primary/70">#{neuron.number}</span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => navigate(`/n/${neuron.number}`)}
        >
          <ExternalLink className="h-3 w-3" />
          Editează
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Title + meta */}
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <h2 className="text-sm font-semibold mb-2 leading-tight">{neuron.title}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-nano font-mono uppercase px-1.5 py-0.5 rounded", STATUS_COLORS[neuron.status] || STATUS_COLORS.draft)}>
            {neuron.status}
          </span>
          <span className="text-micro text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {new Date(neuron.updated_at).toLocaleDateString("ro-RO")}
          </span>
          {neuron.score > 0 && (
            <span className="text-micro text-primary/60 flex items-center gap-0.5">
              <Brain className="h-2.5 w-2.5" /> {neuron.score}
            </span>
          )}
          {neuron.content_category && CATEGORY_BADGE[neuron.content_category] && (() => {
            const cat = CATEGORY_BADGE[neuron.content_category!];
            const CatIcon = cat.icon;
            return (
              <span className={cn("flex items-center gap-0.5 text-nano font-medium px-1.5 py-0.5 rounded-md", cat.color)}>
                <CatIcon className="h-2.5 w-2.5" />
                {cat.label}
              </span>
            );
          })()}
          {neuron.lifecycle && (
            <span className="text-nano text-muted-foreground/50 px-1.5 py-0.5 rounded-md bg-muted">
              {neuron.lifecycle}
            </span>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-2 border-b border-border/50 flex items-center gap-4 text-micro text-muted-foreground shrink-0">
        <span>{blocks.length} blocuri</span>
        <span>{totalChars.toLocaleString()} caractere</span>
        {blockTypes.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {blockTypes.slice(0, 3).map(t => (
              <Badge key={t} variant="secondary" className="text-nano px-1 py-0">{t}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content preview */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground/60">Neuron gol — fără blocuri de conținut.</p>
          </div>
        ) : (
          blocks.map(block => (
            <div key={block.id} className="group">
              <div className="flex items-start gap-2">
                <span className="text-nano font-mono text-muted-foreground/40 mt-1 w-4 shrink-0 text-right">
                  {block.position + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {block.type !== "text" && block.type !== "markdown" && (
                    <span className="text-nano font-mono uppercase text-primary/40 block mb-0.5">{block.type}</span>
                  )}
                  <div className={cn(
                    "text-xs leading-relaxed text-foreground/80",
                    block.type === "code" && "font-mono text-dense bg-muted/50 rounded p-2 overflow-x-auto",
                    block.type === "heading" && "font-semibold text-sm",
                    block.type === "quote" && "italic border-l-2 border-primary/30 pl-3",
                    block.type === "prompt" && "bg-primary/5 rounded p-2 text-dense",
                  )}>
                    {block.content.length > 500 ? block.content.slice(0, 500) + "…" : block.content}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border shrink-0">
        <Button
          size="sm"
          className="w-full h-8 gap-1.5 text-xs"
          onClick={() => navigate(`/n/${neuron.number}`)}
        >
          <ExternalLink className="h-3 w-3" />
          Deschide în editor
        </Button>
      </div>
    </div>
  );
}
