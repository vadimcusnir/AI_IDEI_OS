/**
 * CommercializationCheck — Runs conflict detection before marketplace publishing.
 * Shows overlap with platform services and publish eligibility.
 */
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Shield, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAssetMonetization, type CommercializationResult } from "@/hooks/useAssetMonetization";

interface Props {
  assetId: string;
  assetTitle: string;
  assetTags: string[];
  onResult?: (result: CommercializationResult) => void;
  className?: string;
}

const conflictColors = {
  no_conflict: "text-emerald-500",
  moderate_overlap: "text-amber-500",
  high_overlap: "text-orange-500",
  forbidden_substitution: "text-destructive",
};

const conflictLabels = {
  no_conflict: "No Conflict",
  moderate_overlap: "Moderate Overlap",
  high_overlap: "High Overlap",
  forbidden_substitution: "Blocked — Substitutes Platform Service",
};

export function CommercializationCheck({ assetId, assetTitle, assetTags, onResult, className }: Props) {
  const { runCommercializationCheck, checking } = useAssetMonetization();
  const [result, setResult] = useState<CommercializationResult | null>(null);

  const handleCheck = async () => {
    const r = await runCommercializationCheck(assetId, assetTitle, assetTags);
    setResult(r);
    onResult?.(r);
  };

  if (!result) {
    return (
      <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Commercialization Check</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Before publishing, we verify your asset doesn't conflict with platform services.
        </p>
        <Button size="sm" onClick={handleCheck} disabled={checking} className="gap-1">
          {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
          {checking ? "Checking…" : "Run Check"}
        </Button>
      </div>
    );
  }

  const StatusIcon = result.canPublish ? CheckCircle2 : XCircle;
  const statusColor = result.canPublish ? "text-emerald-500" : "text-destructive";

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-4 w-4", statusColor)} />
          <p className="text-sm font-semibold text-foreground">
            {result.canPublish ? "Eligible to Publish" : "Publishing Blocked"}
          </p>
        </div>
        <Badge variant="outline" className={cn("text-micro", conflictColors[result.conflictLevel])}>
          {conflictLabels[result.conflictLevel]}
        </Badge>
      </div>

      {/* Conflict score bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Conflict Score</span>
          <span className="text-xs font-mono font-bold text-foreground">{result.conflictScore}%</span>
        </div>
        <Progress value={result.conflictScore} className="h-1.5" />
      </div>

      {/* Overlapping services */}
      {result.overlappingServices.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Overlapping Services</p>
          <div className="space-y-1">
            {result.overlappingServices.map((svc, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/30 text-xs">
                <span className="text-foreground">{svc.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-micro">{svc.level}</Badge>
                  <span className="font-mono text-muted-foreground">{svc.overlapPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restrictions */}
      {result.restrictions.length > 0 && (
        <div className="space-y-1">
          {result.restrictions.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Re-run */}
      <Button variant="ghost" size="sm" onClick={handleCheck} disabled={checking} className="w-full text-xs gap-1">
        {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
        Re-run Check
      </Button>
    </div>
  );
}
