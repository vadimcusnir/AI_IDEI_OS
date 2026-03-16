import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import {
  Globe, FileAudio, Scissors, Brain, Network,
  Sparkles, ArrowRight, ArrowDown, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";
import { useTranslation } from "react-i18next";

interface PipelineStage {
  icon: React.ElementType;
  key: string;
  labelKey: string;
  descKey: string;
  status: "active" | "coming";
  link?: string;
  outputs: string[];
}

const STAGES: PipelineStage[] = [
  {
    icon: Globe, key: "source", labelKey: "source_label", descKey: "source_desc",
    status: "active", link: "/extractor",
    outputs: ["Episode", "Metadata", "Raw file"],
  },
  {
    icon: FileAudio, key: "transcribe", labelKey: "transcribe_label", descKey: "transcribe_desc",
    status: "active", link: "/extractor",
    outputs: ["Transcript", "Speaker segments", "Timestamps"],
  },
  {
    icon: Scissors, key: "segment", labelKey: "segment_label", descKey: "segment_desc",
    status: "active",
    outputs: ["Semantic chunks", "Context links"],
  },
  {
    icon: Brain, key: "extract", labelKey: "extract_label", descKey: "extract_desc",
    status: "active", link: "/neurons",
    outputs: ["Neurons", "Entities", "Relations"],
  },
  {
    icon: Network, key: "link", labelKey: "link_label", descKey: "link_desc",
    status: "active", link: "/intelligence",
    outputs: ["Graph nodes", "Topic clusters", "IdeaRank"],
  },
  {
    icon: Sparkles, key: "generate", labelKey: "generate_label", descKey: "generate_desc",
    status: "active", link: "/services",
    outputs: ["50+ deliverables", "Artifacts", "Exports"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function PipelineOverview() {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");

  return (
    <div className="flex-1 overflow-auto">
      <SEOHead
        title={`${t("pipeline_overview.title")} — AI-IDEI`}
        description={t("pipeline_overview.subtitle")}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2">
            {t("pipeline_overview.title")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            {t("pipeline_overview.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <InstantActionSurface />
        </motion.div>

        {/* Pipeline stages */}
        <div className="relative">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isLast = i === STAGES.length - 1;

            return (
              <motion.div
                key={stage.key}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <div
                  className={cn(
                    "group relative flex items-start gap-4 rounded-xl border p-4 transition-all",
                    "bg-card border-border hover:border-primary/25 hover:shadow-sm"
                  )}
                >
                  <div className="relative z-10 shrink-0">
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center border transition-all",
                      "bg-primary/10 border-primary/20 group-hover:border-primary/40 group-hover:shadow-sm"
                    )}>
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono text-muted-foreground/40">L{i}</span>
                      <h3 className="text-sm font-bold tracking-wide">{t(`pipeline_overview.${stage.labelKey}`)}</h3>
                      {stage.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[9px] gap-1 text-primary ml-auto px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => navigate(stage.link!)}
                        >
                          {t("pipeline_overview.open")} <ArrowRight className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                      {t(`pipeline_overview.${stage.descKey}`)}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {stage.outputs.map((out, j) => (
                        <span key={j} className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5 text-primary/50" />
                          {out}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {!isLast && (
                  <div className="flex justify-center py-1.5">
                    <ArrowDown className="h-4 w-4 text-border" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{t("pipeline_overview.complete_pipeline")}</p>
          <p className="text-sm font-medium">
            {t("pipeline_overview.summary", { stages: STAGES.length })}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
