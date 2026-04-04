/**
 * AnalyzePanel — Data analysis, competitor research, performance insights.
 */
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyzePanelProps {
  onCommand: (prompt: string) => void;
}

const ANALYZE_ACTIONS = [
  { icon: TrendingUp, label: "Market Analysis", desc: "Trends & opportunities", prompt: "/analyze market trends for ", accent: "bg-gold/10 text-gold" },
  { icon: Target, label: "Competitor Research", desc: "Deep competitive analysis", prompt: "/analyze competitors in ", accent: "bg-info/10 text-info" },
  { icon: Search, label: "Pattern Detection", desc: "Find patterns across neurons", prompt: "/analyze detect patterns across neurons", accent: "bg-ai-accent/10 text-ai-accent" },
  { icon: BarChart3, label: "Performance Report", desc: "Content & engagement metrics", prompt: "/analyze performance report", accent: "bg-success/10 text-success" },
];

export function AnalyzePanel({ onCommand }: AnalyzePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="py-2 space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <BarChart3 className="h-3 w-3 text-gold" />
          <span className="text-micro font-medium text-muted-foreground/70">Analyze & Research</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ANALYZE_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onCommand(action.prompt)}
              className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/40 hover:bg-card/80 hover:border-border/50 transition-all text-left"
            >
              <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", action.accent)}>
                <action.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-dense font-medium text-foreground/90 leading-tight">{action.label}</p>
                <p className="text-nano text-muted-foreground/50 leading-tight">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
