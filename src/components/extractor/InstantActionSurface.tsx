import { useAuth } from "@/contexts/AuthContext";
import { useInstantPipeline, type PipelineResult } from "@/hooks/useInstantPipeline";
import { InstantActionInput } from "./InstantActionInput";
import { InstantActionProgress } from "./InstantActionProgress";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface InstantActionSurfaceProps {
  onComplete?: () => void;
  onPipelineStart?: () => void;
  onPipelineComplete?: (result: PipelineResult | null) => void;
  compact?: boolean;
  autoShowProgress?: boolean;
}

export function InstantActionSurface({ onComplete, onPipelineStart, onPipelineComplete, compact = false }: InstantActionSurfaceProps) {
  const { user } = useAuth();
  const pipeline = useInstantPipeline({ onComplete, onPipelineStart, onPipelineComplete });

  return (
    <div className={cn("w-full", compact ? "" : "max-w-2xl mx-auto")}>
      <motion.div
        layout
        className={cn(
          "relative rounded-2xl border-2 transition-all duration-300 overflow-hidden",
          pipeline.isDragging
            ? "border-primary bg-primary/5 border-dashed"
            : pipeline.isRunning
              ? "border-primary/40 bg-primary/5"
              : pipeline.stage === "complete"
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card hover:border-primary/20",
        )}
        onDrop={pipeline.handleDrop}
        onDragOver={(e) => { e.preventDefault(); pipeline.setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); pipeline.setIsDragging(false); }}
        role="region"
        aria-label="Content analysis pipeline"
      >
        <AnimatePresence mode="wait">
          {pipeline.stage === "idle" || pipeline.stage === "error" ? (
            <InstantActionInput
              input={pipeline.input}
              setInput={pipeline.setInput}
              selectedFile={pipeline.selectedFile}
              setSelectedFile={pipeline.setSelectedFile}
              isDragging={pipeline.isDragging}
              detectedType={pipeline.detectedType}
              isRunning={pipeline.isRunning}
              balance={pipeline.balance}
              balanceLoading={pipeline.balanceLoading}
              estimatedCost={pipeline.estimatedCost}
              hasEnoughCredits={pipeline.hasEnoughCredits}
              showSettings={pipeline.showSettings}
              setShowSettings={pipeline.setShowSettings}
              extractionDepth={pipeline.extractionDepth}
              setExtractionDepth={pipeline.setExtractionDepth}
              insufficientCredits={pipeline.insufficientCredits}
              setInsufficientCredits={pipeline.setInsufficientCredits}
              fileRef={pipeline.fileRef}
              handleFileSelect={pipeline.handleFileSelect}
              runPipeline={pipeline.runPipeline}
              compact={compact}
              user={user}
            />
          ) : (
            <InstantActionProgress
              stage={pipeline.stage}
              result={pipeline.result}
              reset={pipeline.reset}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
