import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Globe, FileAudio, Scissors, Brain, Network, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PipelineStats { episodes: number; neurons: number; jobs: number; credits: number; }

const STAGES = [
  {
    key: "source", label: "Source", icon: Globe, to: "/extractor",
    description: "Upload content — audio, video, text or URL",
    check: (s: PipelineStats) => s.episodes > 0,
  },
  {
    key: "transcribe", label: "Transcribe", icon: FileAudio, to: "/extractor",
    description: "Transcribe audio/video with AI",
    check: (s: PipelineStats) => s.episodes > 0,
  },
  {
    key: "segment", label: "Segment", icon: Scissors, to: "/extractor",
    description: "Semantic chunking of transcripts",
    check: (s: PipelineStats) => s.neurons > 0,
  },
  {
    key: "extract", label: "Extract", icon: Brain, to: "/neurons",
    description: "Extract knowledge neurons",
    check: (s: PipelineStats) => s.neurons > 0,
  },
  {
    key: "link", label: "Link", icon: Network, to: "/intelligence",
    description: "Build knowledge graph connections",
    check: (s: PipelineStats) => s.neurons > 5,
  },
  {
    key: "generate", label: "Generate", icon: Sparkles, to: "/services",
    description: "Generate deliverables via AI services",
    check: (s: PipelineStats) => s.jobs > 0,
  },
] as const;

export function PipelineIndicator() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PipelineStats>({ episodes: 0, neurons: 0, jobs: 0, credits: 0 });

  useEffect(() => {
    if (!user || !currentWorkspace) return;
    const wsId = currentWorkspace.id;
    Promise.all([
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "completed"),
      supabase.from("credit_transactions").select("amount").eq("user_id", user.id),
    ]).then(([ep, ne, jo, cr]) => {
      const totalCredits = (cr.data as any[])?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) ?? 0;
      setStats({ episodes: ep.count ?? 0, neurons: ne.count ?? 0, jobs: jo.count ?? 0, credits: totalCredits });
    });
  }, [user, currentWorkspace]);

  const completedCount = STAGES.filter(s => s.check(stats)).length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completedCount / STAGES.length) * 100}%` }} />
        </div>
        <span className="text-nano font-mono text-muted-foreground">{completedCount}/{STAGES.length}</span>
      </div>
      {STAGES.map((stage, i) => {
        const done = stage.check(stats);
        return (
          <Tooltip key={stage.key}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate(stage.to)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors hover:bg-muted/50",
                  done ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                  done ? "bg-primary/15 border-primary/30" : "bg-muted border-border"
                )}>
                  {done ? <Check className="h-3 w-3" /> : <stage.icon className="h-3 w-3" />}
                </div>
                <span className={cn("text-dense", done && "font-medium")}>{stage.label}</span>
                {i < STAGES.length - 1 && <div className={cn("ml-auto w-3 h-px", done ? "bg-primary/30" : "bg-border")} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-micro max-w-[200px]">
              {stage.description}
              {done && " ✓"}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

/** Compact horizontal pipeline indicator for global header */
export function CompactPipelineIndicator() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PipelineStats>({ episodes: 0, neurons: 0, jobs: 0, credits: 0 });

  useEffect(() => {
    if (!user || !currentWorkspace) return;
    const wsId = currentWorkspace.id;
    Promise.all([
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("workspace_id", wsId).eq("status", "completed"),
      supabase.from("credit_transactions").select("amount").eq("user_id", user.id),
    ]).then(([ep, ne, jo, cr]) => {
      const totalCredits = (cr.data as any[])?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) ?? 0;
      setStats({ episodes: ep.count ?? 0, neurons: ne.count ?? 0, jobs: jo.count ?? 0, credits: totalCredits });
    });
  }, [user, currentWorkspace]);

  const completedCount = STAGES.filter(s => s.check(stats)).length;

  // Hide when nothing completed — no context to show
  if (completedCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {STAGES.map((stage, i) => {
        const done = stage.check(stats);
        return (
          <Tooltip key={stage.key}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate(stage.to)}
                className="flex items-center gap-1 group"
              >
                <div className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center transition-colors",
                  done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {done ? <Check className="h-2.5 w-2.5" /> : <stage.icon className="h-2.5 w-2.5" />}
                </div>
                <span className={cn(
                  "text-nano hidden md:inline transition-colors",
                  done ? "text-primary font-medium" : "text-muted-foreground group-hover:text-foreground"
                )}>{stage.label}</span>
                {i < STAGES.length - 1 && (
                  <div className={cn("w-3 h-px mx-0.5", done ? "bg-primary/40" : "bg-border")} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-micro">
              {done ? `✓ ${stage.description}` : stage.description}
            </TooltipContent>
          </Tooltip>
        );
      })}
      <span className="text-nano font-mono text-muted-foreground ml-1">{completedCount}/{STAGES.length}</span>
    </div>
  );
}
