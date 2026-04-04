import { useState, useEffect } from "react";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  Database, Loader2, CheckCircle2, XCircle, Clock, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectionRun {
  id: string;
  source_type: string;
  source_id: string | null;
  status: string;
  units_extracted: number;
  units_validated: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  metadata: any;
}

export default function CollectionRuns() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<CollectionRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("collection_runs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setRuns((data as CollectionRun[]) || []);
        setLoading(false);
      });
  }, [user]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
      case "running": return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PremiumGate requiredTier="pro" featureName="Collection Runs" fallback="overlay">
    <PageTransition>
      <div className="flex-1 overflow-auto">
        <SEOHead title="Collection Runs — AI-IDEI" description="View your knowledge collection pipeline runs." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Collection Runs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track all knowledge collection pipeline executions and their results.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold font-mono">{runs.length}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Total Runs</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold font-mono text-primary">{runs.filter(r => r.status === "completed").length}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Completed</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold font-mono">{runs.reduce((s, r) => s + r.units_extracted, 0)}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Units Extracted</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold font-mono">{runs.reduce((s, r) => s + r.units_validated, 0)}</p>
              <p className="text-micro text-muted-foreground uppercase tracking-wider">Validated</p>
            </div>
          </div>

          {runs.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No collection runs yet. Extract content to start collecting knowledge.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map(run => (
                <div key={run.id} className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    {statusIcon(run.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{run.source_type}</span>
                        <Badge variant="outline" className={cn(
                          "text-nano uppercase",
                          run.status === "completed" ? "border-primary/30 text-primary" :
                          run.status === "failed" ? "border-destructive/30 text-destructive" : ""
                        )}>
                          {run.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-micro text-muted-foreground">
                        <span>{new Date(run.started_at).toLocaleString()}</span>
                        <span>{run.units_extracted} extracted</span>
                        <span>{run.units_validated} validated</span>
                        {run.completed_at && (
                          <span>
                            Duration: {Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s
                          </span>
                        )}
                      </div>
                      {run.error_message && (
                        <p className="text-xs text-destructive mt-1">{run.error_message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
    </PremiumGate>
  );
}
