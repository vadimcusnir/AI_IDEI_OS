import { useRef, useEffect, useCallback } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { CommandBubble, type Message } from "./CommandBubble";
import { WelcomeScreen } from "./WelcomeScreen";
import { ExecutionSummary } from "./ExecutionSummary";
import type { CommandPhase, ExecutionState } from "@/hooks/useCommandState";
import type { OutputItem } from "./OutputPanel";

interface MessageStreamProps {
  messages: Message[];
  isStreaming: boolean;
  loading: boolean;
  isEmptyState: boolean;
  phase: CommandPhase;
  execution: ExecutionState;
  outputs: OutputItem[];
  suggestions: any[];
  totalNeurons: number;
  totalEpisodes: number;
  balance: number;
  onCommand: (cmd: string) => void;
  onSaveTemplate: () => void;
  onSaveAllOutputs: () => void;
  onRerun: () => void;
  onViewOutputs: () => void;
}

export function MessageStream({
  messages, isStreaming, loading, isEmptyState,
  phase, execution, outputs, suggestions,
  totalNeurons, totalEpisodes, balance,
  onCommand, onSaveTemplate, onSaveAllOutputs, onRerun, onViewOutputs,
}: MessageStreamProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const durationSeconds =
    execution.startedAt && execution.completedAt
      ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)
      : 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
      {messages.map((msg) => (
        <CommandBubble
          key={msg.id}
          msg={msg}
          isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
        />
      ))}

      {isEmptyState && (
        <WelcomeScreen
          onCommand={onCommand}
          suggestions={suggestions}
          neuronCount={totalNeurons}
          episodeCount={totalEpisodes}
          balance={balance}
        />
      )}

      {loading && !isStreaming && (
        <div className="flex gap-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">
                {phase === "planning" ? "Generating execution plan..." : "Processing..."}
              </span>
            </div>
          </div>
        </div>
      )}

      {(phase === "completed" || phase === "failed") && !isEmptyState && (
        <ExecutionSummary
          phase={phase}
          intent={execution.intent}
          planName={execution.planName}
          totalCredits={execution.totalCredits}
          stepsCompleted={execution.steps.filter(s => s.status === "completed").length}
          totalSteps={execution.steps.length}
          outputCount={outputs.length}
          durationSeconds={durationSeconds}
          errorMessage={execution.errorMessage}
          onSaveTemplate={onSaveTemplate}
          onSaveAllOutputs={onSaveAllOutputs}
          onRerun={onRerun}
          onViewOutputs={onViewOutputs}
        />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
