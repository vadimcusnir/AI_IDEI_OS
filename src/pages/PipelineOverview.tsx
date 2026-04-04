import { useState, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileAudio, Brain, Sparkles, BookOpen,
  ArrowRight, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { PipelineProgressHeader, type PipelineStep } from "@/components/pipeline/PipelineProgressHeader";

const PIPELINE_STEPS: PipelineStep[] = [
  { key: "input", label: "Input", icon: Upload },
  { key: "transcript", label: "Transcript", icon: FileAudio },
  { key: "structure", label: "Structure", icon: Brain },
  { key: "generate", label: "Generate", icon: Sparkles },
  { key: "library", label: "Library", icon: BookOpen },
];

const STEP_INFO: Record<string, { titleKey: string; descKey: string; actionLabel: string; actionLink: string }> = {
  input: { titleKey: "pipeline_overview.source_label", descKey: "pipeline_overview.source_desc", actionLabel: "Upload", actionLink: "/extractor" },
  transcript: { titleKey: "pipeline_overview.transcribe_label", descKey: "pipeline_overview.transcribe_desc", actionLabel: "Transcribe", actionLink: "/extractor" },
  structure: { titleKey: "pipeline_overview.extract_label", descKey: "pipeline_overview.extract_desc", actionLabel: "Extract", actionLink: "/neurons" },
  generate: { titleKey: "pipeline_overview.generate_label", descKey: "pipeline_overview.generate_desc", actionLabel: "Generate", actionLink: "/services" },
  library: { titleKey: "pipeline_overview.link_label", descKey: "pipeline_overview.link_desc", actionLabel: "View Library", actionLink: "/library" },
};

export default function PipelineOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation("pages");
  const { balance } = useCreditBalance();
  const [currentStep, setCurrentStep] = useState(0);

  const step = PIPELINE_STEPS[currentStep];
  const info = STEP_INFO[step.key];

  return (
    <div className="flex-1 overflow-auto">
      <SEOHead
        title={`${t("pipeline_overview.title")} — AI-IDEI`}
        description={t("pipeline_overview.subtitle")}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            {t("pipeline_overview.title")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            {t("pipeline_overview.subtitle")}
          </p>
        </motion.div>

        {/* Progress Header */}
        <div className="mb-6 rounded-xl border border-border bg-card">
          <PipelineProgressHeader
            steps={PIPELINE_STEPS}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        {/* Active Step Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t(info.titleKey)}</h2>
                <p className="text-xs text-muted-foreground">{t(info.descKey)}</p>
              </div>
            </div>

            {/* Step-specific content */}
            {step.key === "input" && (
              <div className="mt-4">
                <InstantActionSurface />
              </div>
            )}

            {step.key !== "input" && (
              <div className="mt-4 flex flex-col items-center py-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("pipeline_overview.navigate_to_step", { step: step.label })}
                </p>
                <Button onClick={() => navigate(info.actionLink)} className="gap-1.5">
                  <Play className="h-3.5 w-3.5" />
                  {info.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            {t("common.previous", "Previous")}
          </Button>
          <span className="text-micro text-muted-foreground">
            {currentStep + 1} / {PIPELINE_STEPS.length}
          </span>
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentStep(Math.min(PIPELINE_STEPS.length - 1, currentStep + 1))}
            disabled={currentStep === PIPELINE_STEPS.length - 1}
          >
            {t("common.next", "Next")}
          </Button>
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center"
        >
          <p className="text-micro font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {t("pipeline_overview.complete_pipeline")}
          </p>
          <p className="text-sm font-medium">
            {t("pipeline_overview.summary", { stages: PIPELINE_STEPS.length })}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
