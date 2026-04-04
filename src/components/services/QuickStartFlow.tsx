/**
 * QuickStartFlow — "<2min idea to asset" CTA.
 * Shows the 3-click flow: Intent → System → Run.
 */
import { motion } from "framer-motion";
import { ArrowRight, Zap, Clock, Target, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Spune ce vrei", desc: "Scrie obiectivul tău", icon: Target, time: "5s" },
  { num: 2, label: "Alege sistemul", desc: "AI recomandă top 3 sisteme", icon: Sparkles, time: "10s" },
  { num: 3, label: "Rulează", desc: "Primești 50+ deliverables", icon: Zap, time: "<2min" },
];

interface QuickStartFlowProps {
  onStart: () => void;
}

export function QuickStartFlow({ onStart }: QuickStartFlowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/[0.02] p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight">Idee → Active Digitale</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Sub 2 minute • 3 click-uri • 50+ deliverables</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-start gap-2 sm:gap-4 mb-5">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="flex items-start gap-2 flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-nano font-mono text-primary/60">{step.time}</span>
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold truncate">{step.label}</p>
                <p className="text-micro text-muted-foreground truncate">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-2 hidden sm:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <Button
        onClick={onStart}
        className="w-full gap-2 h-11 text-sm font-semibold"
      >
        <Zap className="h-4 w-4" />
        Start Production
        <ArrowRight className="h-4 w-4" />
      </Button>

      {/* Social proof */}
      <div className="flex items-center justify-center gap-4 mt-3 text-micro text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-primary/50" />
          1200+ acțiuni AI
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-primary/50" />
          260+ sisteme
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-primary/50" />
          12 output families
        </span>
      </div>
    </motion.div>
  );
}
