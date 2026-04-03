/**
 * Home — Unified Execution Surface.
 * CC-T06: All logic extracted to useCommandCenter hook.
 * This file is LAYOUT ONLY.
 */
import { Sparkles, RotateCcw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { executionActions } from "@/stores/executionStore";

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
import { IntentChips, SystemRecommendations, matchIntentToSystems, type MMSystem } from "@/components/command-center/IntentSystems";
import { LowBalanceGate } from "@/components/command-center/LowBalanceGate";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { GuidedTooltip } from "@/components/onboarding/GuidedTooltip";
import { HOME_TOUR } from "@/components/onboarding/tourDefinitions";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";

export default function Home() {
  const cc = useCommandCenter();

  if (cc.authLoading) return <HomeSkeleton />;

  // ═══ Shared sub-components (no duplication) ═══
  const renderMessages = () => (
    <div ref={cc.scrollRef} className="space-y-4">
      {cc.messages.map((msg) => (
        <CommandBubble
          key={msg.id}
          msg={msg}
          isStreaming={cc.isStreaming && msg === cc.messages[cc.messages.length - 1] && msg.role === "assistant"}
          onRetry={msg.role === "assistant" ? cc.handleRerun : undefined}
        />
      ))}
      {cc.loading && !cc.isStreaming && (
        <div className="flex items-start gap-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[hsl(var(--gold-oxide)/0.15)] to-[hsl(var(--gold-oxide)/0.05)] flex items-center justify-center shrink-0 border border-[hsl(var(--gold-oxide)/0.1)]">
            <Sparkles className="h-3 w-3 text-[hsl(var(--gold-oxide))]" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold-oxide)/0.4)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold-oxide)/0.4)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold-oxide)/0.4)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-muted-foreground ml-1">
              {cc.execState.phase === "planning" ? "Planning..." : "Thinking..."}
            </span>
          </div>
        </div>
      )}
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
      <div ref={cc.messagesEndRef} />
    </div>
  );

  const renderPanels = () => (
    <>
      <AnimatePresence>
        {cc.execState.phase === "confirming" && cc.execState.totalCredits > 0 && !cc.showEconomicGate && (
          <div className="pb-2">
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
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cc.showEconomicGate && cc.execState.phase === "confirming" && (
          <div className="pb-2">
            <EconomicGate
              balance={cc.balance} estimatedCost={cc.execState.totalCredits}
              tierDiscount={cc.tierDiscount} tier={cc.tier}
              onProceed={cc.handleEconomicProceed}
              onCancel={cc.handleEconomicCancel}
            />
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cc.showOutputs && cc.outputs.length > 0 && (
          <div className="pb-2">
            <OutputPanel outputs={cc.outputs} visible={cc.showOutputs} onRerun={cc.handleRerun}
              onClose={() => cc.setShowOutputs(false)} onSaveAll={cc.handleSaveAllOutputs} savingAll={cc.savingAllOutputs} />
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cc.execState.phase === "completed" && cc.showPostExecution && (
          <div className="pb-2">
            <PostExecutionPanel
              intent={cc.execState.intent as any} creditsSpent={cc.execState.totalCredits}
              outputCount={cc.outputs.length}
              onAction={(prompt) => { cc.setInput(prompt); cc.setShowPostExecution(false); cc.inputZoneRef.current?.focus(); }}
              onSaveTemplate={cc.handleSaveTemplate} onDismiss={() => cc.setShowPostExecution(false)} userTier={cc.tier}
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );

  const renderSystemRecs = () => (
    cc.input.length >= 2 ? (
      <SystemRecommendations
        systems={matchIntentToSystems(cc.input)}
        input={cc.input}
        onSelect={(sys: MMSystem) => cc.handleCommand(sys.prompt, true)}
      />
    ) : null
  );

  const renderNewSessionBtn = () => (
    !cc.isEmptyState && (
      <div className="flex justify-center py-1">
        <Button variant="ghost" size="sm" onClick={cc.clearChat}
          className="h-7 px-3 text-[11px] text-muted-foreground/50 hover:text-foreground gap-1.5">
          <RotateCcw className="h-3 w-3" />
          {cc.t("common:new_session", { defaultValue: "New session" })}
        </Button>
      </div>
    )
  );

  const renderInputZone = () => (
    <CommandInputZone
      ref={cc.inputZoneRef} input={cc.input} onInputChange={cc.setInput}
      onSubmit={cc.handleSubmit} onStop={cc.handleStop} loading={cc.loading}
      files={cc.files} onFileSelect={cc.handleFileSelect}
      onRemoveFile={cc.handleRemoveFile}
      showSlashMenu={cc.showSlashMenu} onShowSlashMenuChange={cc.setShowSlashMenu}
      onSlashSelect={cc.onSlashSelect}
      onAttachAction={cc.handleAttachAction}
    />
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[35vh] pt-6">
      <div className="w-full text-center space-y-1.5 mb-5">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-[-0.02em] leading-[1.15] text-foreground">
          {cc.greeting},{" "}
          <span className="text-[hsl(var(--gold-oxide))]">{cc.userName}</span>
        </h1>
        <p className="text-sm text-muted-foreground/70 max-w-md mx-auto leading-relaxed">
          {cc.t("pages:home.what_do_you_want", { defaultValue: "What do you want to achieve?" })}
        </p>
      </div>
      <div className="w-full max-w-2xl mx-auto" data-tour="intent-chips">
        <IntentChips onSelect={(prompt) => { cc.setInput(prompt); cc.inputZoneRef.current?.focus(); }} />
      </div>
    </div>
  );

  return (
    <>
      <WelcomeModal />
      <GuidedTooltip tourId="home-command-center" steps={HOME_TOUR} delay={3000} />
      <SEOHead title={`${cc.t("pages:home.cockpit")} — AI-IDEI`} description={cc.t("pages:home.cockpit_desc")} />

      <div className="flex-1 flex h-[calc(100vh-var(--header-height,56px))] overflow-hidden relative">
        {/* ═══ CENTER: Execution Surface ═══ */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <ExecutionStatusBar
            phase={cc.execState.phase} intent={cc.execState.intent}
            totalCredits={cc.execState.totalCredits}
            stepsCompleted={cc.execState.steps.filter(s => s.status === "completed").length}
            totalSteps={cc.execState.steps.length}
            startedAt={cc.execState.startedAt} errorMessage={cc.execState.errorMessage}
          />

          {/* Permission gate */}
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

          {/* ── MOBILE LAYOUT (< md) ── */}
          <div className="flex-1 flex flex-col min-h-0 md:hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 pb-24 scroll-smooth">
              {cc.isEmptyState ? renderEmptyState() : (
                <div className="pt-4">
                  {renderMessages()}
                  {renderPanels()}
                  {renderSystemRecs()}
                  {renderNewSessionBtn()}
                </div>
              )}
              {cc.isEmptyState && renderSystemRecs()}
            </div>
            {/* Mobile fixed input */}
            <div className="shrink-0 border-t border-border/30 bg-background/95 backdrop-blur-sm px-3 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
              <div className="max-w-3xl mx-auto" data-tour="command-input">
                {renderInputZone()}
              </div>
            </div>
          </div>

          {/* ── DESKTOP LAYOUT (>= md) ── */}
          <div className="flex-1 relative z-10 min-h-0 overflow-hidden hidden md:block">
            {/* TOP — messages or empty state */}
            <div className="absolute inset-x-0 top-0 bottom-[calc(55%+2.5rem)] overflow-hidden">
              {cc.isEmptyState ? (
                <div className="h-full flex flex-col items-center justify-end px-4 sm:px-6 pb-6">
                  <div className="w-full max-w-3xl flex flex-col items-center gap-4">
                    {renderEmptyState()}
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-32 space-y-4">
                    {renderMessages()}
                  </div>
                </div>
              )}
            </div>

            {/* CENTER RAIL — input */}
            <div className="absolute inset-x-0 top-[45%] -translate-y-1/2 z-30 px-4 sm:px-6 pointer-events-none">
              <div className="max-w-3xl mx-auto pointer-events-auto" data-tour="command-input">
                {renderInputZone()}
              </div>
            </div>

            {/* BOTTOM — panels */}
            <div className="absolute inset-x-0 top-[45%] bottom-0 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-6">
                  {cc.isEmptyState && cc.input.length < 2 && (
                    <div className="w-full max-w-2xl mx-auto">
                      <IntentChips onSelect={(prompt) => { cc.setInput(prompt); cc.inputZoneRef.current?.focus(); }} />
                    </div>
                  )}
                  {renderSystemRecs()}
                  {renderPanels()}
                  {renderNewSessionBtn()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Context Drawer ═══ */}
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
