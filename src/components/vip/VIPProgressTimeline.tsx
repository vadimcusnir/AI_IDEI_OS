import { useVIPTier } from "@/hooks/useVIPTier";
import { cn } from "@/lib/utils";
import { Check, Lock, Crown, Star, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MONTH_ICONS: Record<string, React.ElementType> = {
  "sparkles": Sparkles,
  "crown": Crown,
  "star": Star,
};

export function VIPProgressTimeline() {
  const { milestones, currentMonth, isVIP, progress, loading, subscription } = useVIPTier();

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded mb-4" />
        <div className="h-3 bg-muted rounded-full mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!isVIP) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <Crown className="h-10 w-10 text-primary/30 mx-auto mb-3" />
        <h3 className="text-sm font-semibold mb-1">CusnirOS VIP</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
          Programul de 11 luni care îți deblochează tot ecosistemul CusnirOS — framework-uri, war rooms și strategii avansate.
        </p>
        <Badge variant="outline" className="text-micro">
          Necesită abonament Pro activ + NOTA2 tokens
        </Badge>
      </div>
    );
  }

  const startDate = subscription?.started_at ? new Date(subscription.started_at) : null;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">CusnirOS Journey</h3>
        </div>
        <Badge variant="secondary" className="text-micro font-mono">
          Luna {currentMonth}/11
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="mb-1">
        <Progress value={progress} className="h-2" />
      </div>
      <div className="flex justify-between text-nano text-muted-foreground mb-5">
        <span>Start{startDate ? `: ${startDate.toLocaleDateString("ro-RO")}` : ""}</span>
        <span>{progress}% completat</span>
      </div>

      {/* Milestones timeline */}
      <div className="space-y-1">
        {milestones.map((m, idx) => {
          const isUnlocked = m.unlocked;
          const isCurrent = m.month_number === currentMonth;
          const isFuture = m.month_number > currentMonth;

          return (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isCurrent && "bg-primary/5 border border-primary/20",
                isUnlocked && !isCurrent && "opacity-80",
                isFuture && "opacity-40"
              )}
            >
              {/* Status icon */}
              <div className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                isUnlocked ? "bg-status-validated/10" :
                isCurrent ? "bg-primary/10" :
                "bg-muted"
              )}>
                {isUnlocked ? (
                  <Check className="h-3.5 w-3.5 text-status-validated" />
                ) : isFuture ? (
                  <Lock className="h-3 w-3 text-muted-foreground/50" />
                ) : (
                  <Star className="h-3.5 w-3.5 text-primary" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-micro font-mono text-muted-foreground">M{m.month_number}</span>
                  <span className="text-xs font-medium truncate">{m.title}</span>
                  {isCurrent && (
                    <Badge className="text-nano px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                      CURENT
                    </Badge>
                  )}
                </div>
                <p className="text-micro text-muted-foreground truncate">{m.description}</p>
              </div>

              {/* Reward */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "text-micro font-mono shrink-0",
                    isUnlocked ? "text-status-validated" : "text-muted-foreground/50"
                  )}>
                    +{m.reward_neurons}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  {m.reward_neurons} NEURONS reward
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>

      {/* Completed state */}
      {subscription?.completed_at && (
        <div className="mt-4 p-3 rounded-lg bg-status-validated/5 border border-status-validated/20 text-center">
          <Sparkles className="h-5 w-5 text-status-validated mx-auto mb-1" />
          <p className="text-xs font-semibold text-status-validated">CusnirOS Complete!</p>
          <p className="text-micro text-muted-foreground">Acces pe viață la tot ecosistemul.</p>
        </div>
      )}
    </div>
  );
}
