/**
 * ExecutionSummary — Premium completion card.
 * Inline in chat stream, visually distinct.
 * Includes: Share to Community, Save, Re-run.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, Clock, Coins, Layers,
  FileText, Save, RotateCcw, TrendingUp, Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import type { CommandPhase } from "@/stores/executionStore";
import { OutputCounter } from "./OutputCounter";

interface ExecutionSummaryProps {
  phase: CommandPhase;
  intent: string;
  planName: string;
  totalCredits: number;
  stepsCompleted: number;
  totalSteps: number;
  outputCount: number;
  durationSeconds: number;
  errorMessage: string | null;
  onSaveTemplate: () => void;
  onSaveAllOutputs: () => void;
  onRerun: () => void;
  onViewOutputs: () => void;
}

export function ExecutionSummary({
  phase, intent, planName, totalCredits, stepsCompleted, totalSteps,
  outputCount, durationSeconds, errorMessage,
  onSaveTemplate, onSaveAllOutputs, onRerun, onViewOutputs,
}: ExecutionSummaryProps) {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);

  if (phase !== "completed" && phase !== "failed") return null;

  const isSuccess = phase === "completed";

  const handleShareToCommunity = async () => {
    if (!user || sharing) return;
    setSharing(true);
    try {
      // Find "results-sharing" category or first available
      const { data: categories } = await supabase
        .from("forum_categories")
        .select("id, slug")
        .order("position", { ascending: true })
        .limit(5);

      const targetCat = categories?.find(c => c.slug === "results" || c.slug === "showcase" || c.slug === "general") || categories?.[0];
      if (!targetCat) throw new Error("No community category found");

      const title = `🏭 ${planName || intent.replace(/_/g, " ")} — ${outputCount} outputs in ${durationSeconds}s`;
      const content = [
        `## Execution Result`,
        ``,
        `**System**: ${planName || intent.replace(/_/g, " ")}`,
        `**Steps**: ${stepsCompleted}/${totalSteps} completed`,
        `**Cost**: ${totalCredits} NEURONS`,
        `**Duration**: ${durationSeconds}s`,
        `**Outputs Generated**: ${outputCount}`,
        ``,
        `---`,
        ``,
        `*Shared automatically from AI-IDEI execution engine.*`,
      ].join("\n");

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
      const { error } = await supabase
        .from("forum_threads")
        .insert({
          category_id: targetCat.id,
          author_id: user.id,
          title,
          slug: `${slug}-${Date.now()}`,
          content,
          tags: ["execution-result", intent],
        } as any);

      if (error) throw error;

      trackInternalEvent({ event: "result_shared_community", params: { intent, outputs: outputCount, credits: totalCredits } });
      toast.success("Rezultat distribuit în comunitate!");
    } catch (e: any) {
      toast.error(e.message || "Nu s-a putut distribui");
    } finally {
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "rounded-2xl border overflow-hidden",
        isSuccess
          ? "border-green-500/15 bg-gradient-to-b from-green-500/[0.03] to-transparent"
          : "border-destructive/15 bg-gradient-to-b from-destructive/[0.03] to-transparent"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        {isSuccess ? (
          <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {isSuccess ? "Execution Complete" : "Execution Failed"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {planName || intent.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Metrics + Output Counter */}
      <div className="px-4 py-2.5 border-t border-border/30 space-y-2">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span className="tabular-nums">{stepsCompleted}/{totalSteps} steps</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            <span className="tabular-nums">{totalCredits} N</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="tabular-nums">{durationSeconds}s</span>
          </div>
        </div>
        {outputCount > 0 && (
          <OutputCounter targetCount={outputCount} isActive={isSuccess} />
        )}
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="px-4 py-2 border-t border-destructive/10">
          <p className="text-xs text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2.5 border-t border-border/30 flex items-center gap-2 flex-wrap">
        {isSuccess && outputCount > 0 && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 rounded-lg" onClick={onViewOutputs}>
            <FileText className="h-3 w-3" /> View Outputs
          </Button>
        )}
        {isSuccess && outputCount > 1 && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 rounded-lg" onClick={onSaveAllOutputs}>
            <Save className="h-3 w-3" /> Save All
          </Button>
        )}
        {isSuccess && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 rounded-lg" onClick={onSaveTemplate}>
            <TrendingUp className="h-3 w-3" /> Save Workflow
          </Button>
        )}
        {isSuccess && user && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
            onClick={handleShareToCommunity}
            disabled={sharing}
          >
            <Share2 className="h-3 w-3" /> {sharing ? "Sharing..." : "Share"}
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 rounded-lg" onClick={onRerun}>
          <RotateCcw className="h-3 w-3" /> {isSuccess ? "Re-run" : "Retry"}
        </Button>
      </div>
    </motion.div>
  );
}
