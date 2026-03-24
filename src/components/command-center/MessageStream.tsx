/**
 * MessageStream — World-class chat message area.
 * Best practices: centered max-width, scroll-to-bottom FAB, proper spacing.
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { Loader2, Sparkles, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandBubble, type Message } from "./CommandBubble";
import { WelcomeScreen } from "./WelcomeScreen";
import { ExecutionSummary } from "./ExecutionSummary";
import type { CommandPhase, ExecutionState } from "@/hooks/useCommandState";
import type { OutputItem } from "./OutputPanel";
import { cn } from "@/lib/utils";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll-to-bottom FAB logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const durationSeconds =
    execution.startedAt && execution.completedAt
      ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)
      : 0;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {messages.map((msg) => (
          <CommandBubble
            key={msg.id}
            msg={msg}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
            onRetry={msg.role === "assistant" ? onRerun : undefined}
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
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-muted-foreground ml-1">
                {phase === "planning" ? "Planning..." : "Thinking..."}
              </span>
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

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => scrollToBottom()}
            className={cn(
              "absolute bottom-4 left-1/2 -translate-x-1/2 z-20",
              "h-8 w-8 rounded-full bg-card border border-border/60 shadow-lg",
              "flex items-center justify-center",
              "hover:bg-muted hover:shadow-xl transition-all duration-200"
            )}
          >
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
