import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Brain, FileText, TrendingUp, Layers, Activity, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsData {
  totalNeurons: number;
  published: number;
  drafts: number;
  templates: number;
  totalVersions: number;
}

export function LiveStatsBlock() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [neuronsRes, templatesRes, versionsRes] = await Promise.all([
        supabase
          .from("neurons")
          .select("status", { count: "exact" })
          .eq("visibility", "public"),
        supabase
          .from("neuron_templates")
          .select("id", { count: "exact" })
          .eq("is_public", true),
        supabase
          .from("neuron_versions")
          .select("id", { count: "exact" }),
      ]);

      // Count statuses from neurons data
      const allNeurons = neuronsRes.data || [];
      const published = allNeurons.filter(n => n.status === "published").length;
      const drafts = allNeurons.filter(n => n.status === "draft").length;

      setStats({
        totalNeurons: neuronsRes.count || allNeurons.length,
        published,
        drafts,
        templates: templatesRes.count || 0,
        totalVersions: versionsRes.count || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const STAT_ITEMS = stats
    ? [
        { label: "Neuroni publici", value: stats.totalNeurons, icon: Brain, color: "text-primary" },
        { label: "Publicați", value: stats.published, icon: TrendingUp, color: "text-status-validated" },
        { label: "Șabloane", value: stats.templates, icon: Layers, color: "text-ai-accent" },
        { label: "Versiuni", value: stats.totalVersions, icon: Activity, color: "text-muted-foreground" },
      ]
    : [];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
          Statistici live
        </h2>
        <Activity className="h-3 w-3 text-muted-foreground/40" />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {STAT_ITEMS.map(item => (
            <div
              key={item.label}
              className="px-3 py-3 rounded-xl border border-border bg-card text-center"
            >
              <item.icon className={cn("h-4 w-4 mx-auto mb-1.5", item.color)} />
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-nano text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
