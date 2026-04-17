/**
 * Home — Chat-first Command Center.
 * Layout: status bar → scrollable feed → sticky composer.
 * Single scroll region. No split-screen. No absolute positioning.
 * 
 * Shell fills whatever space AppLayout provides via flex-1.
 * No hardcoded height calc — purely flex-driven.
 */
import { useRef, useEffect } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { executionActions } from "@/stores/executionStore";
// PR1: ModeChipBar + 4 mode panels removed — sugestiile din WelcomeScreen
// + slash menu acoperă același rol fără 8 surfețe condiționale concurente.

import { useCommandCenter } from "@/hooks/useCommandCenter";
import { WelcomeScreen } from "@/components/command-center/WelcomeScreen";
import { CommandBubble } from "@/components/command-center/CommandBubble";
import { OutputPanel } from "@/components/command-center/OutputPanel";
import { PlanPreview } from "@/components/command-center/PlanPreview";
import { EconomicGate } from "@/components/command-center/EconomicGate";
import { PermissionGate } from "@/components/command-center/PermissionGate";
import { PostExecutionPanel } from "@/components/command-center/PostExecutionPanel";
import { ExecutionStatusBar } from "@/components/command-center/ExecutionStatusBar";
import { CommandInputZone } from "@/components/command-center/CommandInputZone";
import { ExecutionSummary } from "@/components/command-center/ExecutionSummary";
import { ContextDrawer } from "@/components/command-center/ContextDrawer";
import { SessionList } from "@/components/command-center/SessionList";
import { LowBalanceGate } from "@/components/command-center/LowBalanceGate";
import { KeyboardShortcutsOverlay } from "@/components/command-center/KeyboardShortcutsOverlay";
import { OfflineBanner } from "@/components/command-center/OfflineBanner";
import { ErrorRecoveryHandler, classifyError } from "@/components/command-center/ErrorRecoveryHandler";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { GuidedTooltip } from "@/components/onboarding/GuidedTooltip";
import { HOME_TOUR } from "@/components/onboarding/tourDefinitions";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";
import { MagicPipelineButton } from "@/components/pipeline/MagicPipelineButton";
import { NeuronBundleUpsell } from "@/components/upsell/NeuronBundleUpsell";
import { KnowledgeGapDashboard } from "@/components/upsell/KnowledgeGapDashboard";
import { ComposerChips, type ComposerIntent } from "@/components/command-center/ComposerChips";
import { GlobalDropZone } from "@/components/command-center/GlobalDropZone";

export default function Home() {
  const cc = useCommandCenter();
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [cc.messages, cc.loading, cc.execState.phase]);

  if (cc.authLoading) return <HomeSkeleton />;

  return (
    <>
      <WelcomeModal />
      <GuidedTooltip tourId="home-command-center" steps={HOME_TOUR} delay={3000} />
      <SEOHead title={`${cc.t("pages:home.cockpit")} — AI-IDEI`} description={cc.t("pages:home.cockpit_desc")} />
      <KeyboardShortcutsOverlay />
      <OfflineBanner />
      <GlobalDropZone
        disabled={!!cc.permissionBlock || cc.showEconomicGate || cc.showLowBalance}
        onDrop={(files) => {
          const synthetic = { target: { files: Object.assign(files, { item: (i: number) => files[i], length: files.length }) } } as unknown as React.ChangeEvent<HTMLInputElement>;
          cc.handleFileSelect(synthetic);
          cc.inputZoneRef.current?.focus();
        }}
      />

      {/* ═══ MAIN SHELL: fills AppLayout's <main> via flex-1. No hardcoded height. ═══ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ═══ CENTER COLUMN: flex column, the chat surface ═══ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Status bar moved inline into the feed (below the user message) */}

          {/* ── Permission gate overlay ── */}
          <AnimatePresence>
            {cc.permissionBlock && (
              <PermissionGate
                intent={cc.permissionBlock.intent.category}
                requiredTier={cc.permissionBlock.intent.requiredTier}
                currentTier={cc.tier}
                onDismiss={() => cc.setPermissionBlock(null)}
              />
            )}
          </AnimatePresence>

          {/* ── SCROLLABLE FEED: the single scroll region ── */}
          <div
            ref={feedRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth"
          >
            <div className="max-w-3xl mx-auto px-3 sm:px-6">
              {cc.isEmptyState ? (
                /* ── Empty state: centered welcome ── */
                <div className="flex flex-col items-center justify-center min-h-[60vh] py-6">
                  <WelcomeScreen
                    onCommand={cc.handleCommand}
                    onPipelineMessage={cc.handlePipelineMessage}
                    suggestions={cc.decisionSuggestions}
                    neuronCount={cc.totalNeurons}
                    episodeCount={cc.totalEpisodes}
                    balance={cc.balance}
                  />
                  {/* Session history below welcome */}
                  <SessionList
                    sessions={cc.sessions}
                    currentSessionId={cc.sessionId}
                    onSelect={async (sid) => {
                      const msgs = await cc.loadSession(sid);
                      if (msgs.length > 0) {
                        executionActions.setMessages(msgs);
                      }
                    }}
                    onDelete={cc.deleteSession}
                    className="w-full max-w-md mt-6"
                  />
                  {/* Knowledge gap analysis */}
                  <KnowledgeGapDashboard compact className="w-full max-w-md mt-4" />
                </div>
              ) : (
                /* ── Conversation feed (ChatGPT-style: generous spacing, centered) ── */
                <div className="pt-6 pb-6 space-y-6" role="log" aria-live="polite" aria-label="Conversation">
                  {cc.messages.map((msg) => (
                    <CommandBubble
                      key={msg.id}
                      msg={msg}
                      isStreaming={cc.isStreaming && msg === cc.messages[cc.messages.length - 1] && msg.role === "assistant"}
                      onRetry={msg.role === "assistant" ? cc.handleRerun : undefined}
                    />
                  ))}

                  {/* Inline execution status — flows under the last user message */}
                  {["planning","confirming","executing","delivering","storing"].includes(cc.execState.phase) && (
                    <ExecutionStatusBar
                      inline
                      phase={cc.execState.phase} intent={cc.execState.intent}
                      totalCredits={cc.execState.totalCredits}
                      stepsCompleted={cc.execState.steps.filter(s => s.status === "completed").length}
                      totalSteps={cc.execState.steps.length}
                      startedAt={cc.execState.startedAt} errorMessage={cc.execState.errorMessage}
                    />
                  )}

                  {/* Loading indicator (only when no execution phase is active) */}
                  {cc.loading && !cc.isStreaming && cc.execState.phase === "idle" && (
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">Thinking...</span>
                      </div>
                    </div>
                  )}

                  {/* Error recovery */}
                  {cc.execState.phase === "failed" && cc.execState.errorMessage && (
                    <ErrorRecoveryHandler
                      errorType={classifyError(new Error(cc.execState.errorMessage)).type}
                      message={cc.execState.errorMessage}
                      onRetry={cc.handleRerun}
                      onDismiss={() => executionActions.reset()}
                      className="mb-2"
                    />
                  )}

                  {/* Execution summary */}
                  {(cc.execState.phase === "completed" || cc.execState.phase === "failed") && (
                    <ExecutionSummary
                      phase={cc.execState.phase} intent={cc.execState.intent}
                      planName={cc.execState.planName} totalCredits={cc.execState.totalCredits}
                      stepsCompleted={cc.execState.steps.filter(s => s.status === "completed").length}
                      totalSteps={cc.execState.steps.length} outputCount={cc.outputs.length}
                      durationSeconds={cc.durationSeconds} errorMessage={cc.execState.errorMessage}
                      onSaveTemplate={cc.handleSaveTemplate} onSaveAllOutputs={cc.handleSaveAllOutputs}
                      onRerun={cc.handleRerun} onViewOutputs={() => cc.setShowOutputs(true)}
                    />
                  )}

                  {/* Post-execution upsell */}
                  {cc.execState.phase === "completed" && cc.execState.totalCredits > 0 && (
                    <NeuronBundleUpsell
                      balance={cc.balance}
                      creditsJustSpent={cc.execState.totalCredits}
                    />
                  )}

                  {/* Inline panels */}
                  <AnimatePresence>
                    {cc.execState.phase === "confirming" && cc.execState.totalCredits > 0 && !cc.showEconomicGate && (
                      <PlanPreview
                        plan={{
                          action_id: cc.execState.actionId, intent: cc.execState.intent,
                          confidence: cc.execState.confidence, plan_name: cc.execState.planName,
                          total_credits: cc.execState.totalCredits,
                          steps: cc.execState.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })),
                          objective: cc.execState.objective, output_preview: cc.execState.outputPreview,
                        }}
                        balance={cc.balance}
                        onExecute={cc.handlePlanExecute}
                        onEdit={() => { cc.setInput(`Refine plan: ${cc.execState.intent}`); cc.inputZoneRef.current?.focus(); }}
                        onDismiss={() => executionActions.reset()}
                        executing={cc.loading}
                      />
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {cc.showEconomicGate && cc.execState.phase === "confirming" && (
                      <EconomicGate
                        balance={cc.balance} estimatedCost={cc.execState.totalCredits}
                        tierDiscount={cc.tierDiscount} tier={cc.tier}
                        onProceed={cc.handleEconomicProceed}
                        onCancel={cc.handleEconomicCancel}
                      />
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {cc.showOutputs && cc.outputs.length > 0 && (
                      <OutputPanel outputs={cc.outputs} visible={cc.showOutputs} onRerun={cc.handleRerun}
                        onClose={() => cc.setShowOutputs(false)} onSaveAll={cc.handleSaveAllOutputs} savingAll={cc.savingAllOutputs} />
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {cc.execState.phase === "completed" && cc.showPostExecution && (
                      <PostExecutionPanel
                        intent={cc.execState.intent as any} creditsSpent={cc.execState.totalCredits}
                        outputCount={cc.outputs.length}
                        onAction={(prompt) => { cc.setInput(prompt); cc.setShowPostExecution(false); cc.inputZoneRef.current?.focus(); }}
                        onSaveTemplate={cc.handleSaveTemplate} onDismiss={() => cc.setShowPostExecution(false)} userTier={cc.tier}
                      />
                    )}
                  </AnimatePresence>

                  {/* New session */}
                  {cc.messages.length > 0 && (
                    <div className="flex justify-center py-2">
                      <Button variant="ghost" size="sm" onClick={cc.clearChat}
                        className="h-7 px-3 text-dense text-muted-foreground/50 hover:text-foreground gap-1.5">
                        <RotateCcw className="h-3 w-3" />
                        {cc.t("common:new_session", { defaultValue: "New session" })}
                      </Button>
                    </div>
                  )}

                  <div ref={cc.messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* ── COMPOSER: anchored at bottom, never scrolls ── */}
          <div className="shrink-0 border-t border-border/20 bg-background/95 backdrop-blur-sm px-2 sm:px-4 pt-2 pb-[max(3.75rem,calc(3.5rem+env(safe-area-inset-bottom)))] md:pb-2">
            <div className="max-w-3xl mx-auto" data-tour="command-input">
              {/* PR2: 3 persistent intent chips above composer (Extract · Analyze · Generate) */}
              <ComposerChips
                onSelect={(_intent: ComposerIntent, template: string) => {
                  cc.setInput(template);
                  cc.inputZoneRef.current?.focus();
                }}
              />

              <CommandInputZone
                ref={cc.inputZoneRef} input={cc.input} onInputChange={cc.setInput}
                onSubmit={cc.handleSubmit} onStop={cc.handleStop} loading={cc.loading}
                isSubmitting={cc.isSubmitting}
                files={cc.files} onFileSelect={cc.handleFileSelect}
                onRemoveFile={cc.handleRemoveFile}
                commands={cc.commands} onRemoveCommand={cc.handleRemoveCommand}
                showSlashMenu={cc.showSlashMenu} onShowSlashMenuChange={cc.setShowSlashMenu}
                onSlashSelect={cc.onSlashSelect}
                onAttachAction={cc.handleAttachAction}
              />
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Context Drawer (desktop only, self-managing) ═══ */}
        <ContextDrawer
          execution={cc.execState}
          outputs={cc.outputs}
          balance={cc.balance}
          onSaveTemplate={cc.handleSaveTemplate}
          onViewOutputs={() => cc.setShowOutputs(true)}
          onRerun={cc.handleRerun}
        />
      </div>

      {/* Low balance gate */}
      <AnimatePresence>
        {cc.showLowBalance && (
          <LowBalanceGate balance={cc.balance} onDismiss={() => cc.setShowLowBalance(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
