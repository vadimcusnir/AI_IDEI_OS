/**
 * TierProgressionPanel — Displays L1-L4 progression with current status.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowRight, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface TierRule {
  tier_level: string;
  label: string;
  description: string;
  neurons_spent_threshold: number;
  assets_created_threshold: number;
  streak_days_threshold: number;
  feature_unlocks: string[];
}

interface UserProgress {
  current_level: string;
  neurons_spent_total: number;
  assets_created_total: number;
  current_streak_days: number;
}

const TIER_COLORS: Record<string, string> = {
  L1: "text-muted-foreground",
  L2: "text-sky-400",
  L3: "text-amber-400",
  L4: "text-emerald-400",
};

export function TierProgressionPanel() {
  const { user } = useAuth();
  const [rules, setRules] = useState<TierRule[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [rulesRes, progressRes] = await Promise.all([
      (supabase.from("tier_progression_rules") as any).select("*").order("neurons_spent_threshold"),
      user ? (supabase.from("user_tier_progress") as any).select("*").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setRules((rulesRes.data || []) as TierRule[]);
    setProgress(progressRes.data as UserProgress | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const currentLevel = progress?.current_level || "L1";
  const currentIdx = rules.findIndex(r => r.tier_level === currentLevel);

  return (
    <div className="space-y-4">
      {/* Progression line */}
      <div className="flex items-center gap-1">
        {rules.map((rule, i) => {
          const isActive = rule.tier_level === currentLevel;
          const isPast = i < currentIdx;
          const isFuture = i > currentIdx;
          return (
            <div key={rule.tier_level} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
                isActive ? "border-primary bg-primary/10 text-primary" :
                isPast ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                "border-border/20 bg-muted/10 text-muted-foreground/30"
              )}>
                {isPast ? <Check className="h-3.5 w-3.5" /> : isFuture ? <Lock className="h-3 w-3" /> : rule.tier_level}
              </div>
              {i < rules.length - 1 && (
                <div className={cn("flex-1 h-0.5 rounded", isPast ? "bg-emerald-500/30" : "bg-border/15")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Tier cards */}
      <div className="space-y-2">
        {rules.map((rule, i) => {
          const isActive = rule.tier_level === currentLevel;
          const isPast = i < currentIdx;
          const isNext = i === currentIdx + 1;

          // Progress towards next tier
          let pctNeurons = 0, pctAssets = 0, pctStreak = 0;
          if (isNext && progress) {
            pctNeurons = rule.neurons_spent_threshold > 0 ? Math.min(100, (progress.neurons_spent_total / rule.neurons_spent_threshold) * 100) : 100;
            pctAssets = rule.assets_created_threshold > 0 ? Math.min(100, (progress.assets_created_total / rule.assets_created_threshold) * 100) : 100;
            pctStreak = rule.streak_days_threshold > 0 ? Math.min(100, (progress.current_streak_days / rule.streak_days_threshold) * 100) : 100;
          }

          return (
            <div key={rule.tier_level} className={cn(
              "border rounded-lg p-3 transition-all",
              isActive ? "border-primary/30 bg-primary/5" :
              isPast ? "border-emerald-500/15 bg-emerald-500/5 opacity-60" :
              "border-border/10 opacity-50"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-xs font-bold", TIER_COLORS[rule.tier_level])}>{rule.tier_level}</span>
                <span className="text-xs font-semibold">{rule.label}</span>
                {isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary ml-auto">CURRENT</span>}
              </div>
              <p className="text-[10px] text-muted-foreground/50 mb-2">{rule.description}</p>

              {/* Requirements */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-muted-foreground/40">Neurons</span>
                  <p className="font-mono">{rule.neurons_spent_threshold.toLocaleString()}</p>
                  {isNext && <Progress value={pctNeurons} className="h-1 mt-1" />}
                </div>
                <div>
                  <span className="text-muted-foreground/40">Assets</span>
                  <p className="font-mono">{rule.assets_created_threshold}</p>
                  {isNext && <Progress value={pctAssets} className="h-1 mt-1" />}
                </div>
                <div>
                  <span className="text-muted-foreground/40">Streak</span>
                  <p className="font-mono">{rule.streak_days_threshold}d</p>
                  {isNext && <Progress value={pctStreak} className="h-1 mt-1" />}
                </div>
              </div>

              {/* Unlocks */}
              {rule.feature_unlocks.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {rule.feature_unlocks.map(f => (
                    <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground/50">
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
