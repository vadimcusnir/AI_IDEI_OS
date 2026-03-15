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

export function LeaderboardWidget() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("user_xp")
        .select("user_id, total_xp, level, rank_name")
        .order("total_xp", { ascending: false })
        .limit(10);

      if (!data || data.length === 0) { setLoading(false); return; }

      // Fetch display names
      const userIds = data.map((d: any) => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));

      setEntries(data.map((d: any) => ({
        ...d,
        display_name: profileMap.get(d.user_id) || "Anonymous",
      })));
      setLoading(false);
    };

    load();
  }, []);

  if (loading || entries.length === 0) return null;

  const MEDAL_ICONS = [Trophy, Medal, Award];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
        <Trophy className="h-3 w-3" /> Leaderboard
      </h3>
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
                    i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-600"
                  )} />
                ) : (
                  <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                )}
              </span>
              <span className={cn("text-xs flex-1 truncate", isMe && "font-semibold")}>
                {entry.display_name}{isMe ? " (you)" : ""}
              </span>
              <span className="text-[10px] text-muted-foreground">{entry.rank_name}</span>
              <span className="text-[10px] font-mono font-bold text-primary w-14 text-right">
                {entry.total_xp.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
