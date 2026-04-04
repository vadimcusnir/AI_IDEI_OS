/**
 * PipelinesHub — Clean pipeline cards that expand inline to show their launcher.
 * Mobile-first, action-oriented design.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Layers, Users, Presentation, FileText,
  ChevronDown, Play, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IMFPipelineLauncher } from "@/components/pipeline/IMFPipelineLauncher";
import { Avatar33Panel } from "@/components/services/Avatar33Panel";
import { WebinarGeneratorPanel } from "@/components/services/WebinarGeneratorPanel";
import { ContentGeneratorPanel } from "@/components/services/ContentGeneratorPanel";
import { ExtractionPipelinePanel } from "@/components/services/ExtractionPipelinePanel";

const PIPELINES = [
  {
    key: "imf",
    name: "IMF Pipeline",
    tagline: "1 input → 50+ outputs",
    description: "Upload once, get articles, frameworks, social posts, scripts — all generated automatically in one flow.",
    icon: Zap,
    cost: "500–2000",
    time: "~8 min",
    outputs: "50+",
    accent: "primary",
  },
  {
    key: "extraction",
    name: "Deep Extraction",
    tagline: "13-level analysis",
    description: "Extracts entities, patterns, psychological signals, narrative structures, and commercial insights from any content.",
    icon: Layers,
    cost: "~715",
    time: "~4 min",
    outputs: "12 types",
    accent: "purple-500",
  },
  {
    key: "avatar",
    name: "Avatar33",
    tagline: "33-module client profile",
    description: "Build a complete ideal client avatar: demographics, psychology, buying triggers, JTBD, and content strategy.",
    icon: Users,
    cost: "1650",
    time: "~12 min",
    outputs: "33 modules",
    accent: "amber-500",
  },
  {
    key: "webinar",
    name: "Webinar Generator",
    tagline: "Full webinar kit",
    description: "Structure, slides, script, email sequences, and follow-up — complete webinar production in 48 AI prompts.",
    icon: Presentation,
    cost: "1920",
    time: "~15 min",
    outputs: "48 assets",
    accent: "rose-500",
  },
  {
    key: "content",
    name: "Content Engine",
    tagline: "8 formats at once",
    description: "Generate tweets, LinkedIn posts, blog articles, YouTube scripts, newsletters, and carousels simultaneously.",
    icon: FileText,
    cost: "25–350",
    time: "~2 min",
    outputs: "8 formats",
    accent: "emerald-500",
  },
] as const;

type PipelineKey = typeof PIPELINES[number]["key"];

function getAccentClasses(accent: string) {
  if (accent === "primary") return { text: "text-primary", bg: "bg-primary/10", border: "border-primary/25" };
  return {
    text: `text-${accent}`,
    bg: `bg-${accent}/10`,
    border: `border-${accent}/25`,
  };
}

export function PipelinesHub() {
  const [expanded, setExpanded] = useState<PipelineKey | null>(null);

  return (
    <div className="space-y-3">
      {PIPELINES.map(pipe => {
        const Icon = pipe.icon;
        const isOpen = expanded === pipe.key;
        const colors = getAccentClasses(pipe.accent);

        return (
          <div key={pipe.key} className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm">
            {/* Card header — always visible */}
            <button
              onClick={() => setExpanded(isOpen ? null : pipe.key)}
              className="w-full text-left p-4 sm:p-5 flex items-start gap-4 group"
            >
              <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", colors.bg)}>
                <Icon className={cn("h-5 w-5", colors.text)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{pipe.name}</h3>
                  <span className={cn("text-nano font-medium px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
                    {pipe.tagline}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {pipe.description}
                </p>

                {/* Quick stats — inline */}
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-micro text-muted-foreground">
                    <Coins className="h-3 w-3" /> {pipe.cost} N
                  </span>
                  <span className="text-micro text-muted-foreground">{pipe.time}</span>
                  <span className="text-micro text-muted-foreground">{pipe.outputs}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 mt-1">
                {!isOpen && (
                  <span className="text-micro font-medium text-primary hidden sm:block">Launch</span>
                )}
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )} />
              </div>
            </button>

            {/* Expandable panel */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
                    <div className="border-t border-border pt-4">
                      {pipe.key === "imf" && <IMFPipelineLauncher />}
                      {pipe.key === "extraction" && <ExtractionPipelinePanel />}
                      {pipe.key === "avatar" && <Avatar33Panel />}
                      {pipe.key === "webinar" && <WebinarGeneratorPanel />}
                      {pipe.key === "content" && <ContentGeneratorPanel />}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
