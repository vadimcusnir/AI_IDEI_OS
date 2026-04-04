/**
 * Pipeline — Unified 5-step knowledge production screen
 * Input → Extract → Structure → Generate → Library
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { SEOHead } from "@/components/SEOHead";
import { PipelineStepper, type PipelineStage } from "@/components/pipeline/PipelineStepper";
import { InputStage } from "@/components/pipeline/stages/InputStage";
import { ExtractStage } from "@/components/pipeline/stages/ExtractStage";
import { StructureStage } from "@/components/pipeline/stages/StructureStage";
import { GenerateStage } from "@/components/pipeline/stages/GenerateStage";
import { LibraryStage } from "@/components/pipeline/stages/LibraryStage";

interface ExtractionResult {
  neurons: number;
  episode_id: string;
  type_distribution?: Record<string, number>;
  frameworks?: number;
  raw_extracted?: number;
  after_dedup?: number;
  meta?: { major_insights?: string[]; emerging_themes?: string[]; unexpected_ideas?: string[] };
}

export default function Pipeline() {
  const [stage, setStage] = useState<PipelineStage>("input");
  const [completedStages, setCompletedStages] = useState<PipelineStage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [artifactId, setArtifactId] = useState<string | undefined>();

  const completeStage = useCallback((s: PipelineStage) => {
    setCompletedStages(prev => prev.includes(s) ? prev : [...prev, s]);
  }, []);

  const goTo = useCallback((s: PipelineStage) => {
    setStage(s);
  }, []);

  // Input → Extract transition
  const handlePipelineStart = useCallback(() => {
    completeStage("input");
    setStage("extract");
    setIsProcessing(true);
  }, [completeStage]);

  const handlePipelineComplete = useCallback((res: ExtractionResult) => {
    setResult(res);
    setIsProcessing(false);
    completeStage("extract");
  }, [completeStage]);

  const handleExtractionComplete = useCallback(() => {
    // Episode list refresh — no-op for pipeline flow
  }, []);

  // Structure → Generate
  const handleStructureDone = useCallback(() => {
    completeStage("structure");
    setStage("generate");
  }, [completeStage]);

  // Generate → Library
  const handleGenerateDone = useCallback((artId?: string) => {
    completeStage("generate");
    setArtifactId(artId);
    setStage("library");
  }, [completeStage]);

  // Reset
  const handleReset = useCallback(() => {
    setStage("input");
    setCompletedStages([]);
    setResult(null);
    setArtifactId(undefined);
    setIsProcessing(false);
  }, []);

  const handleStageClick = useCallback((s: PipelineStage) => {
    if (completedStages.includes(s)) {
      goTo(s);
    }
  }, [completedStages, goTo]);

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <SEOHead
            title="Pipeline — AI-IDEI"
            description="Transform content into knowledge assets in 5 steps."
          />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2"
          >
            <p className="text-[length:var(--eyebrow-size)] font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-[hsl(var(--gold-oxide))] mb-1">
              Knowledge Pipeline
            </p>
            <h1 className="text-h2 font-bold leading-[var(--lh-h2)] text-foreground tracking-tight">
              Content → Knowledge → Assets
            </h1>
          </motion.div>

          {/* Stepper */}
          <PipelineStepper
            current={stage}
            completedStages={completedStages}
            onStageClick={handleStageClick}
          />

          {/* Stage content */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              {stage === "input" && (
                <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <InputStage
                    onPipelineStart={handlePipelineStart}
                    onPipelineComplete={handlePipelineComplete}
                    onExtractionComplete={handleExtractionComplete}
                  />
                </motion.div>
              )}

              {stage === "extract" && (
                <motion.div key="extract" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <ExtractStage
                    result={result}
                    isProcessing={isProcessing}
                    onNext={() => {
                      completeStage("extract");
                      setStage("structure");
                    }}
                  />
                </motion.div>
              )}

              {stage === "structure" && result && (
                <motion.div key="structure" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <StructureStage
                    episodeId={result.episode_id}
                    neuronCount={result.neurons}
                    onNext={handleStructureDone}
                  />
                </motion.div>
              )}

              {stage === "generate" && result && (
                <motion.div key="generate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <GenerateStage
                    episodeId={result.episode_id}
                    onNext={handleGenerateDone}
                  />
                </motion.div>
              )}

              {stage === "library" && (
                <motion.div key="library" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <LibraryStage
                    neuronCount={result?.neurons ?? 0}
                    artifactId={artifactId}
                    onReset={handleReset}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
