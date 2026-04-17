import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
}

export function CommentsSection({ postId, isAuthenticated }: { postId: string; isAuthenticated: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null; avatar_url: string | null }>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("blog_comments")
      .select("id, user_id, content, created_at, parent_id")
      .eq("post_id", postId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });
    setComments((data as Comment[]) || []);
    const ids = Array.from(new Set((data || []).map((c: Comment) => c.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
      const map: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      (profs || []).forEach((p: { id: string; display_name: string | null; avatar_url: string | null }) => {
        map[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });
      setProfiles(map);
    }
  };

  useEffect(() => { load(); }, [postId]);

  const submit = async () => {
    if (!text.trim() || !me) return;
    setBusy(true);
    const { error } = await supabase.from("blog_comments").insert({
      post_id: postId, user_id: me, content: text.trim(),
    });
    setBusy(false);
    if (error) { toast.error("Could not post comment"); return; }
    setText("");
    toast.success("Comment posted");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("blog_comments").delete().eq("id", id);
    if (error) { toast.error("Could not delete"); return; }
    setComments((c) => c.filter((x) => x.id !== id));
  };

  return (
    <section className="mt-16">
      <div className="gold-divider mb-8" />
      <h2 className="text-lg font-semibold text-foreground mb-6 tracking-tight flex items-center gap-2">
        <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
      </h2>

      {isAuthenticated ? (
        <div className="mb-8 space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            maxLength={4000}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.length}/4000</span>
            <Button onClick={submit} disabled={busy || !text.trim()} size="sm">
              {busy ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 rounded-xl border border-border bg-card/60 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary font-medium hover:underline">Sign in</Link> to join the conversation.
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No comments yet. Be the first.</p>
        ) : (
          comments.map((c) => {
            const p = profiles[c.user_id];
            const name = p?.display_name || "Anonymous";
            return (
              <div key={c.id} className="flex gap-3 p-4 rounded-xl border border-border/60 bg-card/40">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-primary">{name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {me === c.user_id && (
                      <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
