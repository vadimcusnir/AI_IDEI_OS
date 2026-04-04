import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, TrendingUp, Star, Coins, Zap, Clock } from "lucide-react";

interface AnalyticsData {
  totalGenerations: number;
  totalCreditsSpent: number;
  avgRating: number;
  topGoals: { goal: string; count: number }[];
  recentDays: { day: string; count: number }[];
  variantCount: number;
  chainCount: number;
}

export function PromptAnalytics() {
  const { t } = useTranslation("pages");
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadAnalytics = async () => {
      const { data: history } = await supabase
        .from("prompt_history")
        .select("goal, credits_spent, rating, variant_index, chain_step, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (!history || history.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }

      const totalGenerations = history.length;
      const totalCreditsSpent = history.reduce((sum, h) => sum + (h.credits_spent || 0), 0);
      const rated = history.filter(h => h.rating && h.rating > 0);
      const avgRating = rated.length > 0
        ? rated.reduce((sum, h) => sum + (h.rating || 0), 0) / rated.length
        : 0;

      // Top goals
      const goalCounts: Record<string, number> = {};
      history.forEach(h => {
        goalCounts[h.goal] = (goalCounts[h.goal] || 0) + 1;
      });
      const topGoals = Object.entries(goalCounts)
        .map(([goal, count]) => ({ goal, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent 7 days
      const dayMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap[d.toISOString().split("T")[0]] = 0;
      }
      history.forEach(h => {
        const day = h.created_at.split("T")[0];
        if (day in dayMap) dayMap[day]++;
      });
      const recentDays = Object.entries(dayMap).map(([day, count]) => ({ day, count }));

      const variantCount = history.filter(h => h.variant_index && h.variant_index > 0).length;
      const chainCount = history.filter(h => h.chain_step && h.chain_step > 0).length;

      setData({
        totalGenerations,
        totalCreditsSpent,
        avgRating,
        topGoals,
        recentDays,
        variantCount,
        chainCount,
      });
      setLoading(false);
    };

    loadAnalytics();
  }, [user]);

  if (loading || !data) return null;

  const maxDayCount = Math.max(...data.recentDays.map(d => d.count), 1);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        {t("prompt_forge.analytics_title", { defaultValue: "Statistici Prompt Forge" })}
      </h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-micro text-muted-foreground">Generări</span>
          </div>
          <p className="text-lg font-bold text-foreground">{data.totalGenerations}</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Coins className="h-3 w-3 text-primary" />
            <span className="text-micro text-muted-foreground">Credite</span>
          </div>
          <p className="text-lg font-bold text-foreground">{data.totalCreditsSpent} N</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="h-3 w-3 text-primary" />
            <span className="text-micro text-muted-foreground">Rating mediu</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {data.avgRating > 0 ? data.avgRating.toFixed(1) : "—"}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-micro text-muted-foreground">Variante</span>
          </div>
          <p className="text-lg font-bold text-foreground">{data.variantCount}</p>
        </div>
      </div>

      {/* Activity chart (simple bar) */}
      <div className="p-3 rounded-lg border border-border bg-card">
        <span className="text-micro font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
          <Clock className="h-3 w-3" />
          Ultimele 7 zile
        </span>
        <div className="flex items-end gap-1 h-16">
          {data.recentDays.map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-sm bg-primary/80 transition-all"
                style={{ height: `${Math.max((d.count / maxDayCount) * 100, 4)}%` }}
              />
              <span className="text-nano text-muted-foreground">
                {new Date(d.day).toLocaleDateString("ro", { weekday: "short" }).slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top goals */}
      {data.topGoals.length > 0 && (
        <div className="p-3 rounded-lg border border-border bg-card">
          <span className="text-micro font-medium text-muted-foreground mb-2 block">
            Top Goal-uri
          </span>
          <div className="space-y-1.5">
            {data.topGoals.map(g => (
              <div key={g.goal} className="flex items-center justify-between">
                <span className="text-xs text-foreground truncate flex-1">{g.goal}</span>
                <span className="text-micro font-mono text-muted-foreground ml-2">{g.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
