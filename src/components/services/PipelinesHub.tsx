/**
 * PipelinesHub — Tabbed hub for all pipeline services.
 * Each pipeline gets its own dedicated section with enhanced settings.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Zap, Layers, Users, Presentation, FileText,
  Sparkles, Settings2, Info, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { IMFPipelineLauncher } from "@/components/pipeline/IMFPipelineLauncher";
import { Avatar33Panel } from "@/components/services/Avatar33Panel";
import { WebinarGeneratorPanel } from "@/components/services/WebinarGeneratorPanel";
import { ContentGeneratorPanel } from "@/components/services/ContentGeneratorPanel";
import { ExtractionPipelinePanel } from "@/components/services/ExtractionPipelinePanel";

const PIPELINE_TABS = [
  {
    key: "imf",
    name: "IMF Pipeline",
    subtitle: "Automatic Multiplication",
    description: "1 extraction → 50+ deliverables generated automatically. Chain multiple services into a single automated flow with real-time progress tracking.",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    stats: [
      { label: "Avg. outputs", value: "50+" },
      { label: "Avg. time", value: "~8 min" },
      { label: "Cost range", value: "500–2000 N" },
    ],
    features: ["Real-time progress", "Auto-chaining", "Cost estimation", "Failure recovery"],
  },
  {
    key: "extraction",
    name: "Extraction Pipeline",
    subtitle: "12-Level Deep Analysis",
    description: "Multi-level extraction from raw input to structured knowledge: segmentation, entity extraction, psychological analysis, narrative patterns, commercial insights, and content production.",
    icon: Layers,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    stats: [
      { label: "Levels", value: "13" },
      { label: "Avg. cost", value: "~715 N" },
      { label: "Output types", value: "12" },
    ],
    features: ["Adjustable depth range", "Level-by-level results", "Custom start/end", "Pattern detection"],
  },
  {
    key: "avatar",
    name: "Avatar33",
    subtitle: "Client Profile Engine",
    description: "33 commercial prompts executed in strict order to build a complete ideal client profile: discovery, commercial analysis, content strategy, and synthesis.",
    icon: Users,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    stats: [
      { label: "Modules", value: "33" },
      { label: "Phases", value: "4" },
      { label: "Total cost", value: "1650 N" },
    ],
    features: ["4-phase execution", "Psychological profiling", "JTBD extraction", "Buying triggers"],
  },
  {
    key: "webinar",
    name: "Webinar Generator",
    subtitle: "Full Webinar Production",
    description: "12 modules × 4 prompts = 48 prompts. Complete webinar production: structure, slides, script, email sequences, and quality control.",
    icon: Presentation,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    stats: [
      { label: "Prompts", value: "48" },
      { label: "Modules", value: "12" },
      { label: "Total cost", value: "1920 N" },
    ],
    features: ["Duration config", "Audience targeting", "Slide optimization", "Email sequences"],
  },
  {
    key: "content",
    name: "Content Engine",
    subtitle: "Multi-Format Generation",
    description: "Generate publish-ready content across 8 formats simultaneously: tweets, LinkedIn posts, blog articles, YouTube scripts, newsletters, viral hooks, calendars, and carousels.",
    icon: FileText,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    stats: [
      { label: "Formats", value: "8" },
      { label: "Min. cost", value: "25 N" },
      { label: "Max cost", value: "350 N" },
    ],
    features: ["Selective formats", "Copy to clipboard", "Regenerate individual", "Cost control"],
  },
] as const;

type PipelineKey = typeof PIPELINE_TABS[number]["key"];

export function PipelinesHub() {
  const [activeTab, setActiveTab] = useState<PipelineKey>("imf");
  const activePipeline = PIPELINE_TABS.find(p => p.key === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Pipeline selector — card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {PIPELINE_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                isActive
                  ? `${tab.borderColor} ${tab.bgColor} shadow-sm`
                  : "border-border bg-card hover:border-primary/20 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center",
                isActive ? tab.bgColor : "bg-muted"
              )}>
                <Icon className={cn("h-4 w-4", isActive ? tab.color : "text-muted-foreground")} />
              </div>
              <span className={cn(
                "text-[11px] font-semibold leading-tight",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {tab.name}
              </span>
              <span className="text-[9px] text-muted-foreground leading-tight hidden sm:block">
                {tab.subtitle}
              </span>
              {isActive && (
                <motion.div
                  layoutId="pipeline-indicator"
                  className={cn("absolute -bottom-px left-1/4 right-1/4 h-0.5 rounded-full", tab.color.replace("text-", "bg-"))}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active pipeline detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* Pipeline header with stats */}
          <div className={cn("rounded-xl border p-4 sm:p-5 mb-4", activePipeline.borderColor, activePipeline.bgColor + "/30")}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", activePipeline.bgColor)}>
                <activePipeline.icon className={cn("h-6 w-6", activePipeline.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold">{activePipeline.name}</h2>
                  <Badge variant="outline" className="text-[9px]">{activePipeline.subtitle}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {activePipeline.description}
                </p>

                {/* Stats row */}
                <div className="flex flex-wrap gap-3">
                  {activePipeline.stats.map(stat => (
                    <div key={stat.label} className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{stat.label}:</span>
                      <span className="text-xs font-bold font-mono">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Features chips */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/30">
              <Settings2 className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />
              {activePipeline.features.map(feat => (
                <span
                  key={feat}
                  className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-background/60 text-muted-foreground border border-border/50"
                >
                  {feat}
                </span>
              ))}
            </div>
          </div>

          {/* Pipeline execution panel */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            {activeTab === "imf" && <IMFPipelineLauncher />}
            {activeTab === "extraction" && <ExtractionPipelinePanel />}
            {activeTab === "avatar" && <Avatar33Panel />}
            {activeTab === "webinar" && <WebinarGeneratorPanel />}
            {activeTab === "content" && <ContentGeneratorPanel />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
