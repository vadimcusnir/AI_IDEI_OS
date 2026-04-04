import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Clock, CheckCircle2, XCircle, Loader2, RotateCcw,
  ChevronDown, ChevronUp, Coins, Copy, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface RunRecord {
  id: string;
  service_key: string;
  service_name: string;
  status: string;
  credits_cost: number;
  duration_ms: number | null;
  result_preview: string;
  batch_id: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Props {
  limit?: number;
  serviceKeyFilter?: string;
}

export function ServiceRunHistory({ limit = 20, serviceKeyFilter }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadRuns();
  }, [user, serviceKeyFilter]);

  const loadRuns = async () => {
    let query = supabase
      .from("service_run_history")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (serviceKeyFilter) {
      query = query.eq("service_key", serviceKeyFilter);
    }

    const { data } = await query;
    setRuns((data as RunRecord[]) || []);
    setLoading(false);
  };

  const copyResult = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiat în clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-lg">
        Nicio execuție anterioară. Lansează un serviciu pentru a vedea istoricul.
      </div>
    );
  }

  const showViewAll = runs.length >= limit;

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "failed": return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case "running": return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-2">
      {runs.map(run => {
        const isExpanded = expanded === run.id;
        return (
          <div key={run.id} className="border border-border rounded-lg bg-card overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : run.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
            >
              {statusIcon(run.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{run.service_name}</p>
                <p className="text-micro text-muted-foreground">
                  {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                  {run.duration_ms && ` · ${(run.duration_ms / 1000).toFixed(1)}s`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-nano font-mono">
                  <Coins className="h-2.5 w-2.5 mr-0.5" /> {run.credits_cost}
                </Badge>
                <Badge variant="outline" className={cn(
                  "text-nano",
                  run.status === "completed" && "border-emerald-500/30 text-emerald-500",
                  run.status === "failed" && "border-destructive/30 text-destructive",
                )}>
                  {run.status}
                </Badge>
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border px-3 py-3 space-y-3">
                {run.result_preview && (
                  <div>
                    <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Preview rezultat
                    </p>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs whitespace-pre-wrap max-h-40 overflow-auto">
                      {run.result_preview}
                    </div>
                  </div>
                )}
                {run.batch_id && (
                  <p className="text-micro text-muted-foreground">
                    Batch: <span className="font-mono">{run.batch_id.slice(0, 8)}...</span>
                  </p>
                )}
                <div className="flex gap-2">
                  {run.result_preview && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1 h-7"
                      onClick={() => copyResult(run.result_preview)}
                    >
                      <Copy className="h-3 w-3" /> Copiază
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 h-7"
                    onClick={() => navigate(`/run/${run.service_key}`)}
                  >
                    <RotateCcw className="h-3 w-3" /> Re-run
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {showViewAll && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground mt-2"
          onClick={() => navigate("/service-results")}
        >
          Vezi toate rezultatele →
        </Button>
      )}
    </div>
  );
}
