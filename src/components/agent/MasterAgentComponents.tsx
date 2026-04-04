import { motion } from "framer-motion";
import { Rocket, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ═══ PIPELINE STEPS — sequential phases ═══ */
import {
  Shield, Target, Database, Layers, Zap, Brain, Cpu,
  Package, Store, Sparkles, BarChart3, Award,
} from "lucide-react";

interface PipelineStep {
  key: string;
  label: string;
  icon: LucideIcon;
  phase: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { key: "safety_guard", label: "Safety", icon: Shield, phase: "init" },
  { key: "tier_resolution", label: "Tier", icon: Target, phase: "init" },
  { key: "memory_load", label: "Memory", icon: Database, phase: "init" },
  { key: "planner", label: "Plan", icon: Layers, phase: "plan" },
  { key: "economy_controller", label: "Economy", icon: Zap, phase: "plan" },
  { key: "reserve_neurons", label: "Reserve", icon: Zap, phase: "plan" },
  { key: "neuron_extraction", label: "Extract", icon: Brain, phase: "execute" },
  { key: "pattern_synthesis", label: "Synthesize", icon: Cpu, phase: "execute" },
  { key: "service_matching", label: "Match", icon: Target, phase: "execute" },
  { key: "service_composition", label: "Compose", icon: Layers, phase: "execute" },
  { key: "execution", label: "Execute", icon: Rocket, phase: "execute" },
  { key: "asset_generation", label: "Generate", icon: Package, phase: "produce" },
  { key: "quality_scoring", label: "Score", icon: BarChart3, phase: "produce" },
  { key: "marketplace_packaging", label: "Package", icon: Store, phase: "produce" },
  { key: "auto_service_generation", label: "Auto-Gen", icon: Sparkles, phase: "produce" },
  { key: "idea_rank_scoring", label: "Rank", icon: Award, phase: "produce" },
  { key: "settle_neurons", label: "Settle", icon: Zap, phase: "produce" },
];

export const PHASE_META: Record<string, { label: string; color: string }> = {
  init: { label: "INITIALIZE", color: "text-muted-foreground" },
  plan: { label: "PLAN", color: "text-ai-accent" },
  execute: { label: "EXECUTE", color: "text-primary" },
  produce: { label: "PRODUCE", color: "text-status-validated" },
};

export type ExecutionDepth = "quick" | "standard" | "full";

export const DEPTH_CONFIG: Record<ExecutionDepth, { label: string; desc: string; neurons: string; badge: string }> = {
  quick: { label: "Quick", desc: "~15 neuroni · 3 servicii · ~1 min", neurons: "~500N", badge: "FAST" },
  standard: { label: "Standard", desc: "~25 neuroni · 5 servicii · ~3 min", neurons: "~1500N", badge: "BALANCED" },
  full: { label: "Full Production", desc: "~40 neuroni · 8 servicii · ~5 min", neurons: "~3500N", badge: "MAXIMUM" },
};

export interface StepLog {
  step: string;
  status: string;
  timestamp: string;
  [key: string]: any;
}

export interface AgentResult {
  status: string;
  reason?: string;
  job_id?: string;
  kernel?: {
    tier: string;
    strategy: string;
    cost_charged: number;
    tier_discount_pct: number;
    safety: string;
    memory_runs: number;
    state_flow: string[];
  };
  summary?: {
    neurons_extracted: number;
    clusters_formed: number;
    services_matched: number;
    services_executed: number;
    services_failed?: number;
    assets_generated: number;
    assets_rejected?: number;
    marketplace_drafts: number;
    new_services_created: number;
    top_ranked: any[];
  };
  estimated_cost?: number;
  balance?: number;
  deficit?: number;
  tier_discount_pct?: number;
  neurons?: any[];
  clusters?: any[];
  selected_services?: any[];
  assets?: any[];
  marketplace_items?: any[];
  new_services?: any[];
  ranking?: any[];
  scored_assets?: any[];
  steps?: StepLog[];
}

/* ═══ Animated concentric rings for idle state ═══ */
export function OrbitalRings() {
  return (
    <div className="relative h-48 w-48 mx-auto my-6">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-primary/[0.08]"
          style={{ margin: `${i * 20}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20 + i * 10, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute h-2 w-2 rounded-full bg-primary/30"
            style={{ top: "0%", left: "50%", transform: "translate(-50%, -50%)" }}
          />
        </motion.div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/15 to-ai-accent/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm">
          <Rocket className="h-7 w-7 text-primary" />
        </div>
      </div>
    </div>
  );
}

/* ═══ Pipeline step indicator (visual timeline) ═══ */
export function PipelineTimeline({ currentStep, steps }: { currentStep: string; steps?: StepLog[] }) {
  const currentIdx = PIPELINE_STEPS.findIndex(s => s.key === currentStep);
  const phases = ["init", "plan", "execute", "produce"];

  return (
    <div className="space-y-4">
      {phases.map((phase) => {
        const phaseSteps = PIPELINE_STEPS.filter(s => s.phase === phase);
        const meta = PHASE_META[phase];
        const phaseStartIdx = PIPELINE_STEPS.findIndex(s => s.phase === phase);
        const phaseEndIdx = phaseStartIdx + phaseSteps.length - 1;
        const isPhaseActive = currentIdx >= phaseStartIdx && currentIdx <= phaseEndIdx;
        const isPhaseDone = currentIdx > phaseEndIdx;

        return (
          <div key={phase} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-1 w-6 rounded-full transition-colors duration-500",
                isPhaseDone ? "bg-status-validated" : isPhaseActive ? "bg-primary" : "bg-border"
              )} />
              <span className={cn(
                "text-nano font-mono font-bold tracking-[0.25em] transition-colors duration-300",
                isPhaseDone ? "text-status-validated" : isPhaseActive ? meta.color : "text-muted-foreground/30"
              )}>
                {meta.label}
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 pl-8">
              {phaseSteps.map((step) => {
                const stepIdx = PIPELINE_STEPS.findIndex(s => s.key === step.key);
                const isDone = stepIdx < currentIdx;
                const isCurrent = step.key === currentStep;
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.key}
                    initial={false}
                    animate={{ scale: isCurrent ? 1.05 : 1, opacity: isDone || isCurrent ? 1 : 0.3 }}
                    className={cn(
                      "relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors duration-300",
                      isCurrent && "bg-primary/10 ring-1 ring-primary/30",
                      isDone && "bg-status-validated/5",
                    )}
                  >
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center transition-colors duration-300",
                      isDone ? "bg-status-validated/15" : isCurrent ? "bg-primary/15" : "bg-muted/50"
                    )}>
                      {isDone ? (
                        <CheckCircle className="h-3.5 w-3.5 text-status-validated" />
                      ) : isCurrent ? (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                      ) : (
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </div>
                    <span className={cn(
                      "text-nano font-medium text-center leading-tight",
                      isDone ? "text-status-validated" : isCurrent ? "text-foreground" : "text-muted-foreground/40"
                    )}>
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ Stat card with glow effect ═══ */
export function StatCard({ label, value, icon: Icon, delay = 0 }: {
  label: string; value: number | string; icon: LucideIcon; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative bg-card border border-border rounded-2xl p-4 overflow-hidden hover:border-primary/30 transition-colors"
    >
      <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Icon className="h-4 w-4 text-primary/60 mb-2" />
      <p className="text-3xl font-bold font-mono tracking-tight text-foreground">{value}</p>
      <p className="text-micro text-muted-foreground mt-1 uppercase tracking-wider font-medium">{label}</p>
    </motion.div>
  );
}
