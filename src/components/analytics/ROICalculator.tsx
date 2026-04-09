/**
 * ROICalculator — Shows the user's knowledge ROI based on neurons → artifacts.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calculator, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface ROIData {
  neuronsCreated: number;
  artifactsGenerated: number;
  creditsSpent: number;
  creditsEarned: number;
  conversionRate: number; // neurons → artifacts %
  roi: number; // (earned - spent) / spent * 100
}

export function ROICalculator() {
  const { user } = useAuth();
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [neurons, artifacts, debits, credits] = await Promise.all([
        supabase.from("neurons").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("credit_transactions").select("amount").eq("user_id", user.id).lt("amount", 0),
        supabase.from("credit_transactions").select("amount").eq("user_id", user.id).gt("amount", 0),
      ]);

      const nc = neurons.count || 0;
      const ac = artifacts.count || 0;
      const spent = (debits.data || []).reduce((s, t) => s + Math.abs(t.amount), 0);
      const earned = (credits.data || []).reduce((s, t) => s + t.amount, 0);
      const conversionRate = nc > 0 ? Math.round((ac / nc) * 100) : 0;
      const roi = spent > 0 ? Math.round(((earned - spent) / spent) * 100) : 0;

      setData({ neuronsCreated: nc, artifactsGenerated: ac, creditsSpent: Math.round(spent), creditsEarned: Math.round(earned), conversionRate, roi });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Knowledge ROI</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-nano text-muted-foreground uppercase mb-1">Conversion Rate</p>
          <p className="text-lg font-bold font-mono">{data.conversionRate}%</p>
          <p className="text-nano text-muted-foreground">Neuroni → Artefacte</p>
          <Progress value={Math.min(data.conversionRate, 100)} className="h-1.5 mt-1" />
        </div>
        <div>
          <p className="text-nano text-muted-foreground uppercase mb-1">ROI Net</p>
          <p className={`text-lg font-bold font-mono ${data.roi >= 0 ? "text-primary" : "text-destructive"}`}>
            {data.roi >= 0 ? "+" : ""}{data.roi}%
          </p>
          <p className="text-nano text-muted-foreground">
            {data.creditsEarned.toLocaleString()}N câștigat / {data.creditsSpent.toLocaleString()}N cheltuit
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <TrendingUp className="h-4 w-4 text-primary shrink-0" />
        <p className="text-nano text-muted-foreground">
          {data.artifactsGenerated > 0
            ? `Ai generat ${data.artifactsGenerated} artefacte din ${data.neuronsCreated} neuroni — eficiență ${data.conversionRate}%.`
            : "Începe să generezi artefacte pentru a vedea ROI-ul tău."}
        </p>
      </div>
    </motion.div>
  );
}
