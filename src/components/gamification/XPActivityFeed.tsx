import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Brain, MessageSquare, Trophy, Flame, Gift, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface XPTransaction {
  id: string;
  amount: number;
  source: string;
  description: string;
  created_at: string;
}

const SOURCE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  neuron_created: { icon: Brain, color: "text-primary" },
  job_completed: { icon: ArrowUpRight, color: "text-status-validated" },
  forum_quality_thread: { icon: MessageSquare, color: "text-ai-accent" },
  forum_quality_reply: { icon: MessageSquare, color: "text-ai-accent" },
  achievement: { icon: Trophy, color: "text-primary" },
  streak_bonus: { icon: Flame, color: "text-destructive" },
  daily_challenge: { icon: Gift, color: "text-primary" },
};

export function XPActivityFeed() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from("xp_transactions")
        .select("id, amount, source, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setTransactions((data as unknown as XPTransaction[]) || []);
      setLoading(false);
    };

    load();

    // Real-time updates
    const channel = supabase
      .channel("xp-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "xp_transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newTx = payload.new as unknown as XPTransaction;
          setTransactions((prev) => [newTx, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) return null;
  if (transactions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <Zap className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No XP activity yet. Start creating!</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
        <Zap className="h-3 w-3" /> Recent XP Activity
      </h3>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {transactions.map((tx) => {
          const sourceInfo = SOURCE_ICONS[tx.source] || { icon: Zap, color: "text-muted-foreground" };
          const Icon = sourceInfo.icon;
          return (
            <div key={tx.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors">
              <Icon className={cn("h-3 w-3 shrink-0", sourceInfo.color)} />
              <span className="text-dense text-foreground flex-1 truncate">
                {tx.description || tx.source.replace(/_/g, " ")}
              </span>
              <span className="text-micro font-bold text-primary shrink-0">+{tx.amount}</span>
              <span className="text-nano text-muted-foreground shrink-0 w-16 text-right">
                {formatDistanceToNow(new Date(tx.created_at), { addSuffix: false })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
