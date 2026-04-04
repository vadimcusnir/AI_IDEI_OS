/**
 * DowngradeRetention — Shows value summary when user tries to cancel/downgrade.
 * Displays what they'll lose to create friction before churn.
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Zap, FileText, Brain, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface DowngradeRetentionProps {
  open: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
  currentTier: string;
}

interface UsageStats {
  totalJobs: number;
  totalArtifacts: number;
  totalNeurons: number;
  totalCreditsUsed: number;
  memberSinceDays: number;
}

export function DowngradeRetention({ open, onClose, onConfirmCancel, currentTier }: DowngradeRetentionProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setConfirmed(false);

    async function loadStats() {
      setLoading(true);
      try {
        const jobsQ = (supabase as any).from("neuron_jobs").select("id", { count: "exact", head: true }).eq("user_id", user!.id);
        const artifactsQ = (supabase as any).from("artifacts").select("id", { count: "exact", head: true }).eq("author_id", user!.id);
        const neuronsQ = (supabase as any).from("neurons").select("id", { count: "exact", head: true }).eq("author_id", user!.id);
        const creditsQ = (supabase as any).from("credit_transactions").select("amount").eq("user_id", user!.id);

        const [jobs, artifacts, neurons, credits] = await Promise.all([jobsQ, artifactsQ, neuronsQ, creditsQ]);

        const memberSince = user!.created_at ? new Date(user!.created_at) : new Date();
        const daysDiff = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24));

        setStats({
          totalJobs: jobs.count || 0,
          totalArtifacts: artifacts.count || 0,
          totalNeurons: neurons.count || 0,
          totalCreditsUsed: Math.abs((credits.data || []).reduce((s, t) => s + t.amount, 0)),
          memberSinceDays: daysDiff,
        });
      } catch {
        setStats({ totalJobs: 0, totalArtifacts: 0, totalNeurons: 0, totalCreditsUsed: 0, memberSinceDays: 0 });
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [open, user]);

  const tierDiscount = currentTier === "elite" ? 40 : currentTier === "pro" ? 25 : currentTier === "core" ? 10 : 0;
  const savedEstimate = stats ? Math.round(stats.totalCreditsUsed * (tierDiscount / 100) * 0.002) : 0;

  const VALUE_ITEMS = [
    { icon: Zap, label: "Jobs Executed", value: stats?.totalJobs || 0, suffix: "" },
    { icon: FileText, label: "Assets Created", value: stats?.totalArtifacts || 0, suffix: "" },
    { icon: Brain, label: "Neurons Extracted", value: stats?.totalNeurons || 0, suffix: "" },
    { icon: Coins, label: "Execution Savings", value: savedEstimate, suffix: " USD" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-destructive/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            Before you go...
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Value summary */}
          <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Your {currentTier} achievements
            </p>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {VALUE_ITEMS.map(item => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {item.value.toLocaleString()}{item.suffix}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Loss warning */}
          <div className="flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">You'll lose:</p>
              <ul className="space-y-0.5">
                <li>• {tierDiscount}% execution discount on all services</li>
                <li>• Monthly credit allocation</li>
                <li>• Priority queue access</li>
                {currentTier === "elite" && <li>• Elite-only advanced services</li>}
              </ul>
            </div>
          </div>

          {/* Member duration badge */}
          {stats && stats.memberSinceDays > 30 && (
            <p className="text-center text-xs text-muted-foreground">
              <Badge variant="outline" className="text-micro h-5">
                Member for {stats.memberSinceDays} days
              </Badge>
            </p>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <Button className="w-full" onClick={onClose}>
              Keep my {currentTier} plan
            </Button>
            {!confirmed ? (
              <Button
                variant="ghost"
                className="w-full text-xs text-destructive/60 hover:text-destructive"
                onClick={() => setConfirmed(true)}
              >
                I still want to cancel
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full text-xs border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={onConfirmCancel}
              >
                Confirm cancellation
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
