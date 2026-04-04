import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, XCircle, Clock, Eye, FileText, Coins,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Contribution {
  id: string;
  author_id: string;
  title: string;
  content: string;
  contribution_type: string;
  tags: string[];
  quality_score: number;
  word_count: number;
  status: string;
  neurons_awarded: number;
  created_at: string;
}

export function AdminContributionsTab() {
  const { t } = useTranslation("common");
  const qc = useQueryClient();
  const [reviewNote, setReviewNote] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: contributions, isLoading } = useQuery({
    queryKey: ["admin-contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_contributions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Contribution[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note: string }) => {
      const { error } = await supabase
        .from("content_contributions")
        .update({ status, review_note: note, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-contributions"] });
      toast.success(t("contribution_status", { status: vars.status }));
      setExpandedId(null);
      setReviewNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
    pending: { icon: Clock, color: "text-warning" },
    approved: { icon: CheckCircle2, color: "text-status-validated" },
    rejected: { icon: XCircle, color: "text-destructive" },
  };

  if (isLoading) return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>;

  const pending = (contributions || []).filter((c) => c.status === "pending");
  const reviewed = (contributions || []).filter((c) => c.status !== "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-warning">{pending.length} pending</Badge>
        <Badge variant="outline">{reviewed.length} reviewed</Badge>
      </div>

      {/* Pending first */}
      {pending.map((c) => {
        const cfg = statusConfig[c.status];
        const Icon = cfg.icon;
        return (
          <div key={c.id} className="p-3 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              <span className="text-xs font-medium flex-1">{c.title}</span>
              <Badge variant="outline" className="text-nano">{c.contribution_type}</Badge>
              <span className="text-micro text-muted-foreground">{c.word_count}w</span>
              <span className="text-micro text-muted-foreground">Q:{c.quality_score}</span>
              <span className="text-micro text-muted-foreground">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </span>
              <Button variant="ghost" size="sm" className="h-6" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                <Eye className="h-3 w-3" />
              </Button>
            </div>
            {expandedId === c.id && (
              <div className="space-y-2">
                <div className="p-3 rounded bg-muted/50 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {c.content}
                </div>
                {(c.tags ?? []).length > 0 && (
                  <div className="flex gap-1">
                    {(c.tags ?? []).map((t) => <Badge key={t} variant="outline" className="text-nano">{t}</Badge>)}
                  </div>
                )}
                <Textarea
                  placeholder={t("review_note_placeholder")}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="text-xs"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm" className="gap-1 text-xs bg-status-validated hover:bg-status-validated/90"
                    onClick={() => reviewMutation.mutate({ id: c.id, status: "approved", note: reviewNote })}
                    disabled={reviewMutation.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3" />Approve
                  </Button>
                  <Button
                    size="sm" variant="destructive" className="gap-1 text-xs"
                    onClick={() => reviewMutation.mutate({ id: c.id, status: "rejected", note: reviewNote })}
                    disabled={reviewMutation.isPending}
                  >
                    <XCircle className="h-3 w-3" />Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-micro font-semibold text-muted-foreground uppercase tracking-wider">Previously Reviewed</p>
          {reviewed.slice(0, 20).map((c) => {
            const cfg = statusConfig[c.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                <span className="text-xs flex-1 truncate">{c.title}</span>
                <Badge variant="outline" className={`text-nano ${cfg.color}`}>{c.status}</Badge>
                {c.neurons_awarded > 0 && (
                  <Badge className="text-nano px-1 py-0 bg-primary/10 text-primary border-primary/20">
                    <Coins className="h-2 w-2 mr-0.5" />+{c.neurons_awarded}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
