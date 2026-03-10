import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Brain, Sparkles, Coins, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStats {
  episodes: number;
  neurons: number;
  jobs: number;
  credits: number;
}

const STAGES = [
  { key: "upload", label: "Încarcă", icon: Upload, check: (s: PipelineStats) => s.episodes > 0 },
  { key: "extract", label: "Extrage", icon: Brain, check: (s: PipelineStats) => s.neurons > 0 },
  { key: "execute", label: "Execută", icon: Sparkles, check: (s: PipelineStats) => s.jobs > 0 },
  { key: "capitalize", label: "Capitalizează", icon: Coins, check: (s: PipelineStats) => s.credits > 100 },
] as const;

export function PipelineIndicator() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PipelineStats>({ episodes: 0, neurons: 0, jobs: 0, credits: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("author_id", user.id).eq("status", "completed"),
      supabase.from("user_credits").select("balance").eq("user_id", user.id).maybeSingle(),
    ]).then(([ep, ne, jo, cr]) => {
      setStats({
        episodes: ep.count ?? 0,
        neurons: ne.count ?? 0,
        jobs: jo.count ?? 0,
        credits: (cr.data as any)?.balance ?? 0,
      });
    });
  }, [user]);

  const completedCount = STAGES.filter(s => s.check(stats)).length;

  return (
    <div className="space-y-1.5">
      {/* Progress bar */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(completedCount / STAGES.length) * 100}%` }}
          />
        </div>
        <span className="text-[9px] font-mono text-muted-foreground">
          {completedCount}/{STAGES.length}
        </span>
      </div>

      {/* Stage items */}
      {STAGES.map((stage, i) => {
        const done = stage.check(stats);
        return (
          <div
            key={stage.key}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors",
              done ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "h-5 w-5 rounded-full flex items-center justify-center shrink-0 border transition-colors",
              done
                ? "bg-primary/15 border-primary/30"
                : "bg-muted border-border"
            )}>
              {done ? (
                <Check className="h-3 w-3" />
              ) : (
                <stage.icon className="h-3 w-3" />
              )}
            </div>
            <span className={cn("text-[11px]", done && "font-medium")}>{stage.label}</span>
            {i < STAGES.length - 1 && (
              <div className={cn(
                "ml-auto w-3 h-px",
                done ? "bg-primary/30" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
