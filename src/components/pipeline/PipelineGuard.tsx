/**
 * PipelineGuard — Blocks rendering of pipeline stage components
 * unless the session is in an allowed phase.
 * Fail-closed: if phase doesn't match, shows a locked state.
 */
import { usePipelineSession, type PipelinePhase } from "@/stores/executionStore";
import { Lock } from "lucide-react";

interface PipelineGuardProps {
  /** Phases in which this content is accessible */
  allowedPhases: PipelinePhase[];
  /** What to show when blocked */
  fallbackMessage?: string;
  children: React.ReactNode;
}

export function PipelineGuard({ allowedPhases, fallbackMessage, children }: PipelineGuardProps) {
  const session = usePipelineSession();
  const allowed = allowedPhases.includes(session.pipelinePhase);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
        <Lock className="h-8 w-8 opacity-40" />
        <p className="text-sm max-w-xs text-center">
          {fallbackMessage || `This stage requires pipeline phase: ${allowedPhases.join(" or ")}`}
        </p>
        <span className="text-xs opacity-50">Current: {session.pipelinePhase}</span>
      </div>
    );
  }

  return <>{children}</>;
}
