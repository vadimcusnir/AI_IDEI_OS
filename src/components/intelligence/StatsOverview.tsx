import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Brain, Coins, FileAudio, TrendingUp, Layers, Sparkles, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalNeurons: number;
  draftNeurons: number;
  publishedNeurons: number;
  totalEpisodes: number;
  analyzedEpisodes: number;
  creditsBalance: number;
  creditsSpent: number;
  creditsEarned: number;
  categories: Record<string, number>;
  lifecycles: Record<string, number>;
  recentActivity: { date: string; count: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  transcript: "bg-muted-foreground",
  insight: "bg-primary",
  framework: "bg-emerald-500",
  strategy: "bg-amber-500",
  formula: "bg-destructive",
  pattern: "bg-blue-500",
  avatar: "bg-pink-500",
  argument_map: "bg-teal-500",
  narrative: "bg-orange-500",
  psychological: "bg-purple-500",
  commercial: "bg-cyan-500",
};

export function StatsOverview({ stats }: { stats: Stats }) {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  const maxCat = Math.max(...Object.values(stats.categories), 1);
  const maxActivity = Math.max(...stats.recentActivity.map(a => a.count), 1);

  return (
    <div className="max-w-2xl space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard icon={Brain} label={t("stats.total_neurons")} value={stats.totalNeurons} />
        <KPICard icon={FileAudio} label={t("stats.episodes")} value={stats.totalEpisodes} sub={`${stats.analyzedEpisodes} ${t("stats.analyzed")}`} />
        <KPICard icon={Coins} label={t("stats.credits_spent")} value={stats.creditsSpent} color="text-destructive" />
        <KPICard icon={TrendingUp} label={t("stats.balance")} value={stats.creditsBalance} color="text-primary" />
      </div>

      {/* Status + Lifecycle */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("stats.neuron_status")}</h3>
          <div className="space-y-2">
            <StatusBar label={t("neuron_editor.status_draft")} value={stats.draftNeurons} total={stats.totalNeurons} className="bg-muted-foreground" />
            <StatusBar label={t("neuron_editor.status_published")} value={stats.publishedNeurons} total={stats.totalNeurons} className="bg-primary" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("stats.lifecycle")}</h3>
          <div className="space-y-2">
            {Object.entries(stats.lifecycles).sort(([, a], [, b]) => b - a).map(([key, val]) => (
              <StatusBar key={key} label={key} value={val} total={stats.totalNeurons} className="bg-primary/70" />
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      {Object.keys(stats.categories).length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> {t("stats.content_categories")}
          </h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            {Object.entries(stats.categories).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-micro font-medium w-24 truncate capitalize">{cat.replace("_", " ")}</span>
                <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", CATEGORY_COLORS[cat] || "bg-primary")} style={{ width: `${(count / maxCat) * 100}%` }} />
                </div>
                <span className="text-xs font-mono font-bold w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Activity */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" /> {t("stats.seven_day_activity")}
        </h2>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-end gap-1.5 h-20">
            {stats.recentActivity.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: "60px" }}>
                  <div className="w-full max-w-[28px] bg-primary/80 rounded-t" style={{ height: `${Math.max((day.count / maxActivity) * 60, day.count > 0 ? 4 : 0)}px` }} />
                </div>
                <span className="text-nano text-muted-foreground">{new Date(day.date).toLocaleDateString(undefined, { weekday: "narrow" })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credits */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> {t("stats.credit_economy")}
        </h2>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-2xl font-bold font-mono">{stats.creditsBalance}</span>
              <span className="text-xs text-muted-foreground ml-1.5">{t("neurons_currency")}</span>
            </div>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/credits")}>{t("stats.view_ledger")}</Button>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${stats.creditsEarned > 0 ? (stats.creditsBalance / stats.creditsEarned) * 100 : 100}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-micro text-muted-foreground">{stats.creditsSpent} {t("admin.spent").toLowerCase()}</span>
            <span className="text-micro text-muted-foreground">{stats.creditsEarned} {t("admin.earned").toLowerCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold font-mono", color)}>{value}</p>
      {sub && <p className="text-micro text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBar({ label, value, total, className }: {
  label: string; value: number; total: number; className?: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-micro font-medium w-20 truncate capitalize">{label}</span>
      <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", className)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-micro font-mono w-6 text-right">{value}</span>
    </div>
  );
}
