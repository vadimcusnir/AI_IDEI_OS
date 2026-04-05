import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, CheckCircle2, XCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";

interface ForumFlag {
  id: string;
  target_type: string;
  target_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  resolution_note: string | null;
  created_at: string;
  target_content?: string;
  reporter_name?: string;
}

export function ForumModerationTab() {
  const { t } = useTranslation("common");
  const [flags, setFlags] = useState<ForumFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [resolveNote, setResolveNote] = useState<Record<string, string>>({});

  const loadFlags = async () => {
    setLoading(true);
    let query = supabase
      .from("forum_flags")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) { toast.error(error.message); setLoading(false); return; }

    // Enrich with content and reporter names
    const enriched = await Promise.all((data || []).map(async (flag: any) => {
      let target_content = "";
      if (flag.target_type === "post") {
        const { data: post } = await supabase.from("forum_posts").select("content").eq("id", flag.target_id).single();
        target_content = post?.content?.slice(0, 120) || "";
      } else {
        const { data: thread } = await supabase.from("forum_threads").select("title").eq("id", flag.target_id).single();
        target_content = thread?.title || "";
      }

      const { data: profile } = await supabase.from("profiles_public" as any).select("display_name").eq("user_id", flag.reporter_id).single() as { data: { display_name: string } | null };

      return { ...flag, target_content, reporter_name: profile?.display_name || "Unknown" };
    }));

    setFlags(enriched);
    setLoading(false);
  };

  useEffect(() => { loadFlags(); }, [filter]);

  const resolveFlag = async (flagId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("forum_flags")
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolution_note: resolveNote[flagId] || null,
      })
      .eq("id", flagId);

    if (error) { toast.error(error.message); return; }

    // If approved (content is bad), optionally delete the post
    if (status === "approved") {
      const flag = flags.find(f => f.id === flagId);
      if (flag?.target_type === "post") {
        await supabase.from("forum_posts").delete().eq("id", flag.target_id);
        toast.success(t("common:post_removed"));
      } else if (flag?.target_type === "thread") {
        await supabase.from("forum_threads").update({ is_locked: true }).eq("id", flag.target_id);
        toast.success(t("common:thread_locked"));
      }
    } else {
      toast.success(t("common:flag_dismissed"));
    }
    loadFlags();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" /> Forum Moderation
        </h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading flags...</p>
      ) : flags.length === 0 ? (
        <div className="text-center py-8">
          <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No {filter === "all" ? "" : filter} flags.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Content</TableHead>
              <TableHead className="text-xs">Reporter</TableHead>
              <TableHead className="text-xs">Reason</TableHead>
              <TableHead className="text-xs">Time</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flags.map((flag) => (
              <TableRow key={flag.id}>
                <TableCell>
                  <Badge variant="outline" className="text-nano">{flag.target_type}</Badge>
                </TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">{flag.target_content}</TableCell>
                <TableCell className="text-xs">{flag.reporter_name}</TableCell>
                <TableCell className="text-xs max-w-[150px] truncate">{flag.reason}</TableCell>
                <TableCell className="text-micro text-muted-foreground">
                  {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {flag.status === "pending" ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 text-micro"
                          onClick={() => resolveFlag(flag.id, "approved")}
                        >
                          <XCircle className="h-3 w-3 mr-0.5" />Remove
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-micro"
                          onClick={() => resolveFlag(flag.id, "rejected")}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />Dismiss
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Note..."
                        rows={1}
                        className="text-micro h-6 min-h-0"
                        value={resolveNote[flag.id] || ""}
                        onChange={(e) => setResolveNote(prev => ({ ...prev, [flag.id]: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <Badge variant={flag.status === "approved" ? "destructive" : "secondary"} className="text-nano">
                      {flag.status}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
