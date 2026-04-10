/**
 * LockinScorePanel — Displays the Inevitability/Lock-in Score
 * with 6 dependency vectors and visual gauge.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLockinScore } from "@/hooks/useLockinScore";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Shield, Zap, FileText, Clock, Bot, Wrench, RefreshCw, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_CONFIG: Record<string, { color: string; label: string; description: string }> = {
  minimal: { color: "text-muted-foreground/50", label: "Minimal", description: "Încă nu ai investit suficient." },
  low: { color: "text-blue-400", label: "Low", description: "Primele dependențe se formează." },
  medium: { color: "text-amber-400", label: "Medium", description: "Plecarea devine costisitoare." },
  high: { color: "text-orange-400", label: "High", description: "Infrastructura ta depinde de OS." },
  critical: { color: "text-red-400", label: "Critical", description: "Plecarea = pierderea business-ului." },
};

const VECTORS = [
  { key: "neurons_burned", label: "Neuroni Consumați", icon: Zap, max: 500, weight: "25%" },
  { key: "asset_count", label: "Active Create", icon: FileText, max: 50, weight: "20%" },
  { key: "months_active", label: "Luni Active", icon: Clock, max: 11, weight: "20%" },
  { key: "total_executions", label: "Execuții OS", icon: Wrench, max: 100, weight: "15%" },
  { key: "active_agents", label: "Agenți Activi", icon: Bot, max: 12, weight: "10%" },
  { key: "services_used", label: "Servicii Folosite", icon: Shield, max: 20, weight: "10%" },
] as const;

export function LockinScorePanel() {
  const { result, loading, compute } = useLockinScore();

  useEffect(() => { compute(); }, [compute]);

  const levelCfg = LEVEL_CONFIG[result?.level || "minimal"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/15 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <p className="text-compact font-semibold text-foreground">Inevitability Score</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={compute}
          disabled={loading}
          className="h-7 text-xs"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
          Recalculează
        </Button>
      </div>

      {/* Score Gauge */}
      <div className="px-4 py-5 flex flex-col items-center gap-3">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity="0.2" />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(result?.score || 0) * 2.64} 264`}
              transform="rotate(-90 50 50)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{Math.round(result?.score || 0)}</p>
            <p className="text-nano text-muted-foreground/50">/ 100</p>
          </div>
        </div>
        <div className="text-center">
          <p className={cn("text-sm font-semibold", levelCfg.color)}>{levelCfg.label}</p>
          <p className="text-dense text-muted-foreground/50">{levelCfg.description}</p>
        </div>
      </div>

      {/* Vectors */}
      <div className="px-4 pb-4 space-y-2.5">
        {VECTORS.map((v) => {
          const val = result?.vectors?.[v.key as keyof typeof result.vectors] || 0;
          const pct = Math.min(100, (Number(val) / v.max) * 100);
          return (
            <div key={v.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <v.icon className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-dense text-muted-foreground/70">{v.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-dense font-mono text-foreground/60">{val}/{v.max}</span>
                  <span className="text-nano text-muted-foreground/30">{v.weight}</span>
                </div>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
