/**
 * SavedPipelines — Lists saved pipeline templates with run/delete actions.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, Trash2, Coins, Clock, Workflow,
  ChevronRight, Loader2, BookmarkCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

interface SavedPipeline {
  id: string;
  name: string;
  description: string;
  intent_key: string;
  steps: Array<{ tool: string; label: string; credits: number; config?: Record<string, string> }>;
  estimated_credits: number;
  estimated_duration_seconds: number;
  success_count: number;
  failure_count: number;
  created_at: string;
}

interface SavedPipelinesProps {
  onExecute: (pipeline: SavedPipeline) => void;
}

export function SavedPipelines({ onExecute }: SavedPipelinesProps) {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState<SavedPipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("agent_plan_templates")
      .select("*")
      .eq("intent_key", "pipeline")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setPipelines((data as any[]) || []);
        setLoading(false);
      });
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("agent_plan_templates").delete().eq("id", id);
    if (!error) {
      setPipelines(prev => prev.filter(p => p.id !== id));
      toast.success("Pipeline deleted");
    } else {
      toast.error("Failed to delete pipeline");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pipelines.length === 0) {
    return (
      <div className="text-center py-8">
        <BookmarkCheck className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
        <p className="text-xs text-muted-foreground">No saved pipelines yet.</p>
        <p className="text-micro text-muted-foreground/60 mt-1">Create one using the Pipeline Composer above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pipelines.map((pipeline) => {
        const steps = Array.isArray(pipeline.steps) ? pipeline.steps : [];
        const totalRuns = pipeline.success_count + pipeline.failure_count;
        const successRate = totalRuns > 0 ? Math.round((pipeline.success_count / totalRuns) * 100) : null;

        return (
          <motion.div
            key={pipeline.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "border border-border rounded-xl p-3 bg-card",
              "hover:border-primary/25 hover:shadow-sm transition-all group"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Workflow className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xs font-bold truncate">{pipeline.name}</h4>
                  <Badge variant="outline" className="text-nano h-4">{steps.length} steps</Badge>
                  {successRate !== null && (
                    <Badge variant="outline" className={cn("text-nano h-4", successRate > 70 ? "text-status-validated" : "text-amber-500")}>
                      {successRate}% success
                    </Badge>
                  )}
                </div>

                {/* Step chain preview */}
                <div className="flex items-center gap-1 mb-2 overflow-x-auto scrollbar-none">
                  {steps.map((step, i) => (
                    <span key={i} className="flex items-center gap-1 shrink-0">
                      <span className="text-nano bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-medium">
                        {step.label}
                      </span>
                      {i < steps.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/30" />}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-nano text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Coins className="h-2.5 w-2.5" />
                    {pipeline.estimated_credits}N
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    ~{pipeline.estimated_duration_seconds}s
                  </span>
                  <span>{format(new Date(pipeline.created_at), "dd MMM yyyy")}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(pipeline.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm" className="h-7 text-micro gap-1"
                  onClick={() => onExecute(pipeline)}
                >
                  <Play className="h-3 w-3" /> Run
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
