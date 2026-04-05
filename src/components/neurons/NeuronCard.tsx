import { useNavigate } from "react-router-dom";
import { Pin, PinOff, MoreHorizontal, BookOpen, Trash2, Star, Zap, Sparkles, Brain, Lightbulb, Network, MessageSquareQuote, BarChart3, HelpCircle, Layers, Target, Boxes, Search } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NeuronListItem, ViewMode } from "@/hooks/useNeuronList";

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  insight: { icon: Lightbulb, color: "text-semantic-amber bg-semantic-amber/10", label: "Insight" },
  framework: { icon: Layers, color: "text-semantic-blue bg-semantic-blue/10", label: "Framework" },
  pattern: { icon: Network, color: "text-semantic-purple bg-semantic-purple/10", label: "Pattern" },
  narrative: { icon: MessageSquareQuote, color: "text-semantic-emerald bg-semantic-emerald/10", label: "Narrative" },
  commercial: { icon: Target, color: "text-semantic-rose bg-semantic-rose/10", label: "Commercial" },
  psychological: { icon: Brain, color: "text-semantic-rose bg-semantic-rose/10", label: "Psychological" },
  strategy: { icon: Boxes, color: "text-semantic-cyan bg-semantic-cyan/10", label: "Strategy" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  published: "bg-status-validated/15 text-status-validated",
  archived: "bg-muted text-muted-foreground/60",
};

const STATUS_DOTS: Record<string, string> = {
  draft: "bg-muted-foreground/40",
  active: "bg-primary",
  published: "bg-status-validated",
  archived: "bg-muted-foreground/30",
};

function formatDate(d: string) {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "acum";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}z`;
  return date.toLocaleDateString("ro-RO", { month: "short", day: "numeric" });
}

interface Props {
  neuron: NeuronListItem;
  viewMode: ViewMode;
  isPinned: boolean;
  isSelected?: boolean;
  onTogglePin: (id: number, e?: React.MouseEvent) => void;
  onToggleSelect?: (id: number, e?: React.MouseEvent) => void;
  onDelete: (id: number, e?: React.MouseEvent) => void;
  onPreview?: (neuron: NeuronListItem) => void;
}

export function NeuronCard({ neuron: n, viewMode, isPinned, isSelected, onTogglePin, onToggleSelect, onDelete, onPreview }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onPreview) {
      onPreview(n);
    } else {
      navigate(`/n/${n.number}`);
    }
  };

  const contextMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
        <button className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(n.id); }}>
          {isPinned ? <PinOff className="h-3.5 w-3.5 mr-2" /> : <Pin className="h-3.5 w-3.5 mr-2" />}
          {isPinned ? "Unpin" : "Pin to top"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/n/${n.number}`); }}>
          <BookOpen className="h-3.5 w-3.5 mr-2" /> Deschide
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/batch/${n.id}`); }}>
          <Zap className="h-3.5 w-3.5 mr-2" /> Batch Execute
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={(e) => onDelete(n.id, e)}>
          <Trash2 className="h-3.5 w-3.5 mr-2" /> Șterge
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (viewMode === "list") {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
          "hover:bg-accent/50 border border-transparent hover:border-border",
          isPinned && "bg-primary/[0.03] border-primary/10",
          isSelected && "bg-primary/10 border-primary/20"
        )}
      >
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={(e) => { e.stopPropagation(); onToggleSelect(n.id); }}
            onClick={(e) => e.stopPropagation()}
            className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
          />
        )}
        <button
          onClick={(e) => onTogglePin(n.id, e)}
          className={cn(
            "h-5 w-5 flex items-center justify-center rounded shrink-0 transition-all",
            isPinned ? "text-primary" : "text-transparent group-hover:text-muted-foreground/30 hover:!text-primary"
          )}
        >
          <Pin className="h-3 w-3" style={isPinned ? {} : { fill: "none" }} />
        </button>
        <div className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOTS[n.status] || STATUS_DOTS.draft)} />
        <span className="text-dense font-mono text-primary/70 w-10 shrink-0">#{n.number}</span>
        <span className="flex-1 text-sm truncate">{n.title}</span>
        {n.content_category && CATEGORY_CONFIG[n.content_category] && (() => {
          const cat = CATEGORY_CONFIG[n.content_category!];
          const CatIcon = cat.icon;
          return (
            <span className={cn("flex items-center gap-0.5 text-nano font-medium px-1.5 py-0.5 rounded-md shrink-0", cat.color)}>
              <CatIcon className="h-2.5 w-2.5" />
              {cat.label}
            </span>
          );
        })()}
        <span className="text-micro text-muted-foreground/60 shrink-0">{formatDate(n.updated_at)}</span>
        {n.has_embedding && (
          <span title="Semantic search ready" className="shrink-0">
            <Search className="h-2.5 w-2.5 text-status-validated/60" />
          </span>
        )}
        {n.score > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Star className="h-2.5 w-2.5 text-primary/40" />
            <span className="text-nano text-primary/40">{n.score}</span>
          </div>
        )}
        {contextMenu}
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group relative flex flex-col p-4 rounded-xl border border-border bg-card cursor-pointer transition-all hover:shadow-md hover:border-primary/20",
          isPinned && "ring-1 ring-primary/20",
          isSelected && "ring-1 ring-primary/40 bg-primary/5"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2 rounded-full", STATUS_DOTS[n.status] || STATUS_DOTS.draft)} />
            <span className="text-micro font-mono text-primary/60">#{n.number}</span>
            {n.has_embedding && <span title="Semantic search ready"><Search className="h-2.5 w-2.5 text-status-validated/50" /></span>}
          </div>
          <div className="flex items-center gap-1">
            {isPinned && <Pin className="h-3 w-3 text-primary/60" />}
            {contextMenu}
          </div>
        </div>
        <h3 className="text-sm font-medium line-clamp-2 mb-1">{n.title}</h3>
        {n.content_category && CATEGORY_CONFIG[n.content_category] && (() => {
          const cat = CATEGORY_CONFIG[n.content_category!];
          const CatIcon = cat.icon;
          return (
            <span className={cn("inline-flex items-center gap-0.5 text-nano font-medium px-1.5 py-0.5 rounded-md w-fit mt-1", cat.color)}>
              <CatIcon className="h-2.5 w-2.5" />
              {cat.label}
            </span>
          );
        })()}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <span className="text-nano text-muted-foreground/50">{formatDate(n.updated_at)}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-nano gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); navigate(`/services?neuron=${n.id}`); }}
            >
              <Sparkles className="h-3 w-3" /> Run
            </Button>
            <span className={cn("text-nano font-mono uppercase px-1.5 py-0.5 rounded", STATUS_COLORS[n.status] || STATUS_COLORS.draft)}>
              {n.status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Cards view
  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col p-5 rounded-xl border border-border bg-card cursor-pointer transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5",
        isPinned && "ring-1 ring-primary/20 bg-primary/[0.02]",
        isSelected && "ring-1 ring-primary/40 bg-primary/5"
      )}
    >
      {isPinned && (
        <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
          <Pin className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOTS[n.status] || STATUS_DOTS.draft)} />
        <span className="text-micro font-mono text-primary/60">#{n.number}</span>
        {n.has_embedding && <span title="Semantic search ready"><Search className="h-2.5 w-2.5 text-status-validated/50" /></span>}
        <span className="text-nano text-muted-foreground/50 ml-auto">{formatDate(n.updated_at)}</span>
      </div>
      <h3 className="text-base font-medium line-clamp-2 mb-1">{n.title}</h3>
      {n.content_category && CATEGORY_CONFIG[n.content_category] && (() => {
        const cat = CATEGORY_CONFIG[n.content_category!];
        const CatIcon = cat.icon;
        return (
          <span className={cn("inline-flex items-center gap-1 text-nano font-medium px-2 py-0.5 rounded-md w-fit mb-2", cat.color)}>
            <CatIcon className="h-3 w-3" />
            {cat.label}
            {n.lifecycle && <span className="opacity-60">· {n.lifecycle}</span>}
          </span>
        );
      })()}
      {n.title === "Untitled Neuron" && (
        <p className="text-dense text-muted-foreground/60 line-clamp-2 mb-3">Neuron gol — click pentru a edita</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
        <span className={cn("text-nano font-mono uppercase px-1.5 py-0.5 rounded", STATUS_COLORS[n.status] || STATUS_COLORS.draft)}>
          {n.status}
        </span>
        <div className="flex items-center gap-1">
          {n.score > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 text-primary/30" />
              <span className="text-nano text-primary/40">{n.score}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-nano gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); navigate(`/services?neuron=${n.id}`); }}
          >
            <Sparkles className="h-3 w-3" /> Run Service
          </Button>
          {contextMenu}
        </div>
      </div>
    </div>
  );
}
