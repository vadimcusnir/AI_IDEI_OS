/**
 * CostSimulator — Estimates monthly costs for 3 usage profiles.
 * Light (20 runs), Medium (50 runs), Heavy (100 runs).
 */
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calculator, Coins, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CatalogService {
  service_key: string;
  name: string;
  credits_cost: number;
  category: string;
}

const PROFILES = [
  { key: "light", label: "Light", runs: 20, icon: Coins, description: "Occasional use — exploration & testing" },
  { key: "medium", label: "Medium", runs: 50, icon: TrendingUp, description: "Regular use — weekly content production" },
  { key: "heavy", label: "Heavy", runs: 100, icon: Zap, description: "Power use — daily production pipeline" },
] as const;

const NEURON_RATE = 0.01; // $0.01 per NEURON (approx)

export function CostSimulator() {
  const [activeProfile, setActiveProfile] = useState<string>("medium");
  const [services, setServices] = useState<CatalogService[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("service_catalog")
        .select("service_key, name, credits_cost, category")
        .eq("is_active", true)
        .order("credits_cost", { ascending: true });
      if (data) setServices(data as CatalogService[]);
    })();
  }, []);

  const profile = PROFILES.find(p => p.key === activeProfile) || PROFILES[1];

  const breakdown = useMemo(() => {
    if (services.length === 0) return null;

    // Group by category, calculate avg cost
    const categories: Record<string, { name: string; services: number; avgCost: number }> = {};
    services.forEach(s => {
      const cat = s.category || "general";
      if (!categories[cat]) categories[cat] = { name: cat, services: 0, avgCost: 0 };
      categories[cat].services++;
      categories[cat].avgCost += s.credits_cost;
    });
    Object.values(categories).forEach(c => { c.avgCost = Math.round(c.avgCost / c.services); });

    const avgCostPerRun = Math.round(services.reduce((s, v) => s + v.credits_cost, 0) / services.length);
    const totalNeurons = avgCostPerRun * profile.runs;
    const totalUSD = totalNeurons * NEURON_RATE;
    const costPerOutput = totalUSD / (profile.runs * 3); // ~3 outputs per run avg

    return {
      categories: Object.values(categories).sort((a, b) => b.avgCost - a.avgCost).slice(0, 5),
      avgCostPerRun,
      totalNeurons,
      totalUSD,
      costPerOutput,
    };
  }, [services, profile]);

  if (!breakdown) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center">
          <Calculator className="h-4 w-4 text-accent-foreground" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider">Cost Simulator</h3>
          <p className="text-micro text-muted-foreground">Estimate your monthly AI production costs</p>
        </div>
      </div>

      {/* Profile selector */}
      <div className="grid grid-cols-3 gap-2">
        {PROFILES.map(p => {
          const Icon = p.icon;
          const isActive = activeProfile === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setActiveProfile(p.key)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                isActive
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/20"
              )}
            >
              <Icon className={cn("h-4 w-4 mb-1.5", isActive ? "text-primary" : "text-muted-foreground")} />
              <p className="text-xs font-bold">{p.label}</p>
              <p className="text-micro text-muted-foreground">{p.runs} runs/mo</p>
            </button>
          );
        })}
      </div>

      {/* Results */}
      <motion.div
        key={activeProfile}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/60 bg-card p-4 space-y-4"
      >
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold font-mono">{breakdown.totalNeurons.toLocaleString()}</p>
            <p className="text-micro text-muted-foreground">NEURONS/mo</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono">${breakdown.totalUSD.toFixed(0)}</p>
            <p className="text-micro text-muted-foreground">≈ USD/mo</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono text-primary">${breakdown.costPerOutput.toFixed(3)}</p>
            <p className="text-micro text-muted-foreground">/output</p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="space-y-1.5">
          <p className="text-micro font-medium text-muted-foreground">Avg. cost by category</p>
          {breakdown.categories.map(cat => {
            const pct = Math.round((cat.avgCost / breakdown.avgCostPerRun) * 100);
            return (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="text-micro w-24 truncate capitalize">{cat.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="text-micro font-mono w-12 text-right">{cat.avgCost}N</span>
              </div>
            );
          })}
        </div>

        <p className="text-nano text-muted-foreground text-center">
          Based on {services.length} active services • Avg {breakdown.avgCostPerRun}N per run
        </p>
      </motion.div>
    </section>
  );
}
