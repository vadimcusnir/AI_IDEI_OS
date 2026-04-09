/**
 * UserActivityStats — Personal KPI cards for the user's activity.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Zap, FileText, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Stats {
  totalNeurons: number;
  totalEpisodes: number;
  totalArtifacts: number;
  totalCreditsSpent: number;
}

export function UserActivityStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [neurons, episodes, artifacts, credits] = await Promise.all([
        supabase.from("neurons").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("episodes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("credit_transactions").select("amount").eq("user_id", user.id).lt("amount", 0),
      ]);
      const spent = (credits.data || []).reduce((s, t) => s + Math.abs(t.amount), 0);
      setStats({
        totalNeurons: neurons.count || 0,
        totalEpisodes: episodes.count || 0,
        totalArtifacts: artifacts.count || 0,
        totalCreditsSpent: Math.round(spent),
      });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "Neuroni", value: stats.totalNeurons, icon: Brain, color: "text-primary" },
    { label: "Episoade", value: stats.totalEpisodes, icon: FileText, color: "text-accent-foreground" },
    { label: "Artefacte", value: stats.totalArtifacts, icon: Zap, color: "text-primary" },
    { label: "NEURONI cheltuiți", value: stats.totalCreditsSpent, icon: TrendingUp, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card border border-border rounded-xl p-4 text-center"
        >
          <c.icon className={`h-4 w-4 mx-auto mb-1.5 ${c.color}`} />
          <p className="text-lg font-bold font-mono">{c.value.toLocaleString()}</p>
          <p className="text-nano text-muted-foreground uppercase tracking-wider">{c.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
