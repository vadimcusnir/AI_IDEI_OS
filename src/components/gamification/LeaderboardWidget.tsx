import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  level: number;
  rank_name: string;
  display_name?: string;
}

type Period = "week" | "month" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

export function LeaderboardWidget() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("week");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      if (period === "all") {
        // All-time: sort by total_xp via RPC
        const { data } = await supabase.rpc("get_leaderboard_xp", { lim: 20 });

        if (!data || data.length === 0) { setLoading(false); setEntries([]); return; }
        await enrichEntries(data);
      } else {
        // Weekly/Monthly: aggregate xp_transactions
        const now = new Date();
        const since = period === "week"
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
          : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data: txns } = await supabase
          .from("xp_transactions")
          .select("user_id, amount")
          .gte("created_at", since);

        if (!txns || txns.length === 0) { setLoading(false); setEntries([]); return; }

        // Aggregate per user
        const agg = new Map<string, number>();
        txns.forEach((t: any) => {
          agg.set(t.user_id, (agg.get(t.user_id) || 0) + t.amount);
        });

        const sorted = [...agg.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20);

        const userIds = sorted.map(([uid]) => uid);
        const { data: xpData } = await supabase.rpc("get_leaderboard_xp", { lim: 50 });

        const xpMap = new Map((xpData || []).map((x: any) => [x.user_id, x]));

        const mapped = sorted.map(([uid, xp]) => ({
          user_id: uid,
          total_xp: xp,
          level: xpMap.get(uid)?.level || 1,
          rank_name: xpMap.get(uid)?.rank_name || "Novice",
        }));

        await enrichEntries(mapped);
      }
    };

    const enrichEntries = async (data: any[]) => {
      const userIds = data.map((d) => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("user_id, display_name")
        .in("user_id", userIds) as { data: { user_id: string; display_name: string }[] | null };

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      setEntries(data.map((d) => ({
        ...d,
        display_name: profileMap.get(d.user_id) || "Anonymous",
      })));
      setLoading(false);
    };

    load();
  }, [period]);

  const MEDAL_ICONS = [Trophy, Medal, Award];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* Period tabs */}
      <div className="flex items-center gap-1 mb-3">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-2.5 py-1 rounded-md text-micro font-medium transition-colors",
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">No activity yet this period</div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry, i) => {
            const isMe = entry.user_id === user?.id;
            const MedalIcon = i < 3 ? MEDAL_ICONS[i] : null;
            return (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors",
                  isMe && "bg-primary/5 border border-primary/10"
                )}
              >
                <span className="w-5 text-center">
                  {MedalIcon ? (
                    <MedalIcon className={cn(
                      "h-3.5 w-3.5 mx-auto",
                      i === 0 ? "text-primary" : i === 1 ? "text-muted-foreground" : "text-accent-foreground"
                    )} />
                  ) : (
                    <span className="text-micro text-muted-foreground">{i + 1}</span>
                  )}
                </span>
                <span className={cn("text-xs flex-1 truncate", isMe && "font-semibold")}>
                  {entry.display_name}{isMe ? " (you)" : ""}
                </span>
                <span className="text-micro text-muted-foreground">{entry.rank_name}</span>
                <span className="text-micro font-mono font-bold text-primary w-14 text-right">
                  {entry.total_xp.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
