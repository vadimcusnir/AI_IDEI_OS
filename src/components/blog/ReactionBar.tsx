import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sparkles, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPES = [
  { key: "like", label: "Like", icon: Heart },
  { key: "clap", label: "Clap", icon: Sparkles },
  { key: "insightful", label: "Insightful", icon: Lightbulb },
] as const;

type ReactionType = typeof TYPES[number]["key"];

export function ReactionBar({ postId, isAuthenticated }: { postId: string; isAuthenticated: boolean }) {
  const [counts, setCounts] = useState<Record<ReactionType, number>>({ like: 0, clap: 0, insightful: 0 });
  const [mine, setMine] = useState<Set<ReactionType>>(new Set());
  const [busy, setBusy] = useState<ReactionType | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase.from("blog_reactions").select("reaction_type, user_id").eq("post_id", postId);
      if (cancel || !data) return;
      const c: Record<ReactionType, number> = { like: 0, clap: 0, insightful: 0 };
      const m = new Set<ReactionType>();
      const { data: { user } } = await supabase.auth.getUser();
      data.forEach((r: { reaction_type: string; user_id: string }) => {
        c[r.reaction_type as ReactionType] = (c[r.reaction_type as ReactionType] || 0) + 1;
        if (user && r.user_id === user.id) m.add(r.reaction_type as ReactionType);
      });
      setCounts(c);
      setMine(m);
    })();
    return () => { cancel = true; };
  }, [postId]);

  const toggle = async (type: ReactionType) => {
    if (!isAuthenticated) {
      toast.info("Sign in to react");
      return;
    }
    setBusy(type);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(null); return; }
    const has = mine.has(type);
    if (has) {
      await supabase.from("blog_reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("reaction_type", type);
      setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }));
      setMine((s) => { const n = new Set(s); n.delete(type); return n; });
    } else {
      await supabase.from("blog_reactions").insert({ post_id: postId, user_id: user.id, reaction_type: type });
      setCounts((c) => ({ ...c, [type]: c[type] + 1 }));
      setMine((s) => new Set(s).add(type));
    }
    setBusy(null);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {TYPES.map(({ key, label, icon: Icon }) => {
        const active = mine.has(key);
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            disabled={busy === key}
            aria-pressed={active}
            aria-label={label}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-9 rounded-full border transition-all text-xs font-medium",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("w-3.5 h-3.5", active && "fill-current")} />
            <span>{counts[key]}</span>
          </button>
        );
      })}
    </div>
  );
}
