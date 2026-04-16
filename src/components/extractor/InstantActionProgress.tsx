import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Zap, Globe, FileAudio, Scissors, Brain, Network,
  Sparkles, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { PipelineStage, PipelineResult } from "@/hooks/useInstantPipeline";

interface StageConf { label: string; icon: React.ElementType; progress: number }

const STAGE_CONFIG: Record<PipelineStage, StageConf> = {
  idle:       { label: "",                          icon: Zap,           progress: 0 },
  source:     { label: "Importing source…",         icon: Globe,         progress: 8 },
  transcribe: { label: "Transcribing audio…",       icon: FileAudio,     progress: 25 },
  segment:    { label: "Segmenting content…",       icon: Scissors,      progress: 40 },
  extract:    { label: "Extracting neurons…",       icon: Brain,         progress: 60 },
  link:       { label: "Linking knowledge graph…",  icon: Network,       progress: 80 },
  generate:   { label: "Generating assets…",        icon: Sparkles,      progress: 92 },
  complete:   { label: "Pipeline complete!",        icon: CheckCircle2,  progress: 100 },
  error:      { label: "Pipeline failed",           icon: Zap,           progress: 0 },
};

const PIPELINE_STEPS: PipelineStage[] = ["source", "transcribe", "segment", "extract", "link", "generate", "complete"];
const PIPELINE_LABELS: Record<string, string> = {
  source: "Source", transcribe: "Transcribe", segment: "Segment",
  extract: "Extract", link: "Link", generate: "Generate", complete: "Done",
};

interface InstantActionProgressProps {
  stage: PipelineStage;
  result: PipelineResult | null;
  reset: () => void;
}

export function InstantActionProgress({ stage, result, reset }: InstantActionProgressProps) {
  const currentStage = STAGE_CONFIG[stage];

  return (
    <motion.div
      key="pipeline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-5 sm:p-6"
      role="status"
      aria-live="polite"
      aria-label={currentStage.label}
    >
      {/* Active stage */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          stage === "complete" ? "bg-primary/15" : "bg-primary/10"
        )}>
          {stage === "complete" ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1">
          <p className={cn(
            "text-sm font-semibold",
            stage === "complete" ? "text-primary" : "text-foreground"
          )}>
            {currentStage.label}
          </p>
          {result && stage === "complete" && (
            <div>
              <p className="text-xs text-muted-foreground">
                {result.neurons > 0
                  ? `${result.neurons} neurons extracted${result.frameworks ? ` · ${result.frameworks} frameworks` : ""}${result.raw_extracted ? ` · ${result.raw_extracted} raw → ${result.after_dedup} deduped` : ""}`
                  : "Episode created — add audio to extract neurons"
                }
              </p>
              {result.type_distribution && Object.keys(result.type_distribution).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {Object.entries(result.type_distribution).map(([type, count]) => (
                    <span key={type} className="text-nano px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                      {type} {count}
                    </span>
                  ))}
                </div>
              )}
              {result.meta?.emerging_themes && result.meta.emerging_themes.length > 0 && (
                <p className="text-micro text-muted-foreground/70 mt-1">
                  Themes: {result.meta.emerging_themes.slice(0, 3).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={currentStage.progress} className="h-1.5 mb-4" aria-label="Pipeline progress" />

      {/* 7-step pipeline visualization */}
      <div className="flex items-center justify-between" role="list" aria-label="Pipeline stages">
        {PIPELINE_STEPS.map((s, i) => {
          const isActive = stage === s;
          const isPast = currentStage.progress > STAGE_CONFIG[s].progress;
          const StageIcon = STAGE_CONFIG[s].icon;
          return (
            <div key={s} className="flex items-center gap-0.5" role="listitem">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive ? "bg-primary text-primary-foreground scale-110 shadow-sm" :
                  isPast ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground/40"
                )} aria-label={`${PIPELINE_LABELS[s]}: ${isActive ? 'in progress' : isPast ? 'completed' : 'pending'}`}>
                  <StageIcon className="h-3 w-3" aria-hidden="true" />
                </div>
                <span className={cn(
                  "text-nano leading-none font-medium hidden sm:block",
                  isActive ? "text-primary" : isPast ? "text-primary/60" : "text-muted-foreground/40"
                )}>
                  {PIPELINE_LABELS[s]}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 w-2 sm:w-4 rounded-full transition-colors mx-0.5",
                  isPast ? "bg-primary/30" : "bg-border"
                )} aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {/* Complete actions */}
      {stage === "complete" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-5 pt-3 border-t border-border"
        >
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={reset}>
            New Analysis
          </Button>
          {result && result.neurons > 0 && (
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => {
              window.location.href = "/neurons";
            }}>
              <Brain className="h-3 w-3" />
              View Neurons
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
