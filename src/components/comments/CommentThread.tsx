import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CommentThreadProps {
  targetType: "neuron" | "artifact" | "entity";
  targetId: string | number;
  className?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

/**
 * P3-007: Commenting System
 * Uses chat_messages table with session_id as "comment:{targetType}:{targetId}"
 * to store threaded comments on any resource.
 */
export function CommentThread({ targetType, targetId, className }: CommentThreadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const sessionKey = `comment:${targetType}:${targetId}`;
  const queryKey = ["comments", sessionKey];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, content, created_at, user_id")
        .eq("session_id", sessionKey)
        .eq("role", "comment")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as Comment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("chat_messages").insert({
        session_id: sessionKey,
        content,
        user_id: user.id,
        role: "comment",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment("");
      toast.success("Comment added");
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const handleSubmit = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    addComment.mutate(trimmed);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>Comments ({comments.length})</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No comments yet.</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-3 space-y-1">
              <p className="text-sm text-foreground">{c.content}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}

      {user && (
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[60px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newComment.trim() || addComment.isPending}
            className="shrink-0"
          >
            {addComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
