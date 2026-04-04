import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, GitMerge, Check, X, ExternalLink, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Duplicate {
  id: string;
  neuron_a: number;
  neuron_b: number;
  similarity: number;
  status: string;
  title_a?: string;
  title_b?: string;
}

export function DuplicateMergePanel() {
  const { t } = useTranslation(["common", "errors"]);
  const { user } = useAuth();
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    dup: Duplicate;
    action: "merge" | "dismiss";
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDuplicates();
  }, [user]);

  const fetchDuplicates = async () => {
    const { data, error } = await supabase
      .from("neuron_duplicates")
      .select("*")
      .eq("status", "pending")
      .order("similarity", { ascending: false })
      .limit(20);

    if (error) {
      toast.error(t("common:duplicates_load_failed"));
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setDuplicates([]);
      setLoading(false);
      return;
    }

    // Fetch titles for all neuron IDs
    const allIds = [...new Set(data.flatMap((d: any) => [d.neuron_a, d.neuron_b]))];
    const { data: neurons } = await supabase
      .from("neurons")
      .select("id, title")
      .in("id", allIds);

    const titleMap = new Map((neurons || []).map((n: any) => [n.id, n.title]));

    setDuplicates(
      (data as any[]).map(d => ({
        ...d,
        title_a: titleMap.get(d.neuron_a) || `Neuron #${d.neuron_a}`,
        title_b: titleMap.get(d.neuron_b) || `Neuron #${d.neuron_b}`,
      }))
    );
    setLoading(false);
  };

  const handleAction = async (action: "merge" | "dismiss") => {
    if (!actionDialog || !user) return;
    setProcessing(true);
    const { dup } = actionDialog;

    try {
      if (action === "dismiss") {
        await supabase
          .from("neuron_duplicates")
          .update({
            status: "dismissed",
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", dup.id);

        toast.success(t("common:duplicate_dismissed"));
      } else {
        // Merge: keep neuron_a, archive neuron_b
        // 1. Copy blocks from neuron_b to neuron_a
        const { data: blocksB } = await supabase
          .from("neuron_blocks")
          .select("*")
          .eq("neuron_id", dup.neuron_b)
          .order("position");

        const { data: blocksA } = await supabase
          .from("neuron_blocks")
          .select("position")
          .eq("neuron_id", dup.neuron_a)
          .order("position", { ascending: false })
          .limit(1);

        const maxPos = blocksA?.[0]?.position ?? -1;

        if (blocksB && blocksB.length > 0) {
          const newBlocks = blocksB.map((b: any, i: number) => ({
            neuron_id: dup.neuron_a,
            type: b.type,
            content: b.content,
            position: maxPos + 1 + i,
            execution_mode: b.execution_mode,
            language: b.language,
            metadata: b.metadata,
          }));
          await supabase.from("neuron_blocks").insert(newBlocks);
        }

        // 2. Archive neuron_b
        await supabase
          .from("neurons")
          .update({ status: "archived", lifecycle: "compounded" })
          .eq("id", dup.neuron_b);

        // 3. Mark duplicate resolved
        await supabase
          .from("neuron_duplicates")
          .update({
            status: "merged",
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", dup.id);

        toast.success(t("common:merged_into_neuron", { id: dup.neuron_a }));
      }

      setDuplicates(prev => prev.filter(d => d.id !== dup.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("errors:generic"));
    } finally {
      setProcessing(false);
      setActionDialog(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (duplicates.length === 0) {
    return (
      <div className="text-center py-12">
        <GitMerge className="h-8 w-8 opacity-20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No pending duplicates</p>
        <p className="text-micro text-muted-foreground/60 mt-1">
          Run deduplication from the Extractor to find similar neurons.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Potential Duplicates ({duplicates.length})
          </h3>
        </div>

        {duplicates.map(dup => (
          <div
            key={dup.id}
            className="border border-border rounded-xl bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-micro font-mono text-muted-foreground">#{dup.neuron_a}</span>
                  <span className="text-sm font-medium truncate">{dup.title_a}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-micro font-mono text-muted-foreground">#{dup.neuron_b}</span>
                  <span className="text-sm font-medium truncate">{dup.title_b}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-micro shrink-0",
                  dup.similarity > 0.8 ? "border-destructive/40 text-destructive" :
                  dup.similarity > 0.6 ? "border-yellow-500/40 text-yellow-600 dark:text-yellow-400" :
                  "border-muted-foreground/30"
                )}
              >
                {(dup.similarity * 100).toFixed(0)}% similar
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={() => setActionDialog({ dup, action: "merge" })}
              >
                <GitMerge className="h-3 w-3" />
                Merge
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1.5 text-muted-foreground"
                onClick={() => setActionDialog({ dup, action: "dismiss" })}
              >
                <X className="h-3 w-3" />
                Dismiss
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={() => window.open(`/n/${dup.neuron_a}`, "_blank")}
              >
                <ExternalLink className="h-3 w-3" />
                A
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={() => window.open(`/n/${dup.neuron_b}`, "_blank")}
              >
                <ExternalLink className="h-3 w-3" />
                B
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog?.action === "merge" ? (
                <>
                  <GitMerge className="h-4 w-4 text-primary" />
                  Confirm Merge
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-muted-foreground" />
                  Dismiss Duplicate
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {actionDialog?.action === "merge" ? (
                <>
                  <AlertTriangle className="h-3 w-3 inline mr-1 text-yellow-500" />
                  This will merge <strong>#{actionDialog.dup.neuron_b}</strong> into <strong>#{actionDialog.dup.neuron_a}</strong>.
                  Blocks from neuron B will be appended to neuron A. Neuron B will be archived.
                </>
              ) : (
                <>This pair will be marked as not duplicates and won't appear again.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setActionDialog(null)} disabled={processing}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={actionDialog?.action === "merge" ? "default" : "secondary"}
              onClick={() => handleAction(actionDialog!.action)}
              disabled={processing}
              className="gap-1.5"
            >
              {processing && <Loader2 className="h-3 w-3 animate-spin" />}
              {actionDialog?.action === "merge" ? "Merge" : "Dismiss"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
