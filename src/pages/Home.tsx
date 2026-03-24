/**
 * Home — Unified Execution Surface.
 * LEFT = AppSidebar (control), CENTER = execution, RIGHT = ContextDrawer (on demand).
 * Zero navigation on execution. Single surface.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useExecution } from "@/hooks/useExecution";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useExecutionStore, executionActions, type Message } from "@/stores/executionStore";
import { useExecutionHistory } from "@/hooks/useExecutionHistory";
import { useRealtimeSteps } from "@/hooks/useRealtimeSteps";
import { useAgentDecisionEngine } from "@/hooks/useAgentDecisionEngine";
import { useUserTier } from "@/hooks/useUserTier";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUp, Sparkles, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CommandBubble } from "@/components/command-center/CommandBubble";
import { type OutputItem } from "@/stores/executionStore";
import { OutputPanel } from "@/components/command-center/OutputPanel";
import { PlanPreview } from "@/components/command-center/PlanPreview";
import { EconomicGate } from "@/components/command-center/EconomicGate";
import { PermissionGate } from "@/components/command-center/PermissionGate";
import { PostExecutionPanel } from "@/components/command-center/PostExecutionPanel";
import { ExecutionStatusBar } from "@/components/command-center/ExecutionStatusBar";
import { CommandInputZone, type CommandInputZoneRef } from "@/components/command-center/CommandInputZone";
import { ExecutionSummary } from "@/components/command-center/ExecutionSummary";
import { ContextDrawer } from "@/components/command-center/ContextDrawer";
import { IntentChips, SystemRecommendations, matchIntentToSystems, type MMSystem } from "@/components/command-center/IntentSystems";
import { AgentSlashMenu } from "@/components/agent/AgentSlashMenu";
import { WorkspaceLayerTabs, type WorkspaceLayer } from "@/components/command-center/WorkspaceLayerTabs";
import { LowBalanceGate } from "@/components/command-center/LowBalanceGate";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";
import { routeCommand, type RouteResult } from "@/components/command-center/CommandRouter";
import {
  logCommandSubmitted, logPlanConfirmed, logExecutionCompleted,
  logPermissionDenied, logEconomicGate,
} from "@/components/command-center/AuditLogger";

const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-console`;

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation(["common", "errors", "pages"]);

  const {
    sessionId, sessions,
    saveMessage, loadSession, loadCurrentSession,
    deleteSession, newSession, refreshSessions,
  } = useChatHistory();
  const store = useExecutionStore();
  const { execution: execState, messages, outputs, loading, isStreaming } = store;
  const { persistRun, persistOutputsBatch } = useExecutionHistory();
  const { tier } = useUserTier();
  const tierDiscount = tier === "pro" ? 25 : tier === "free" ? 0 : 10;
  const [totalNeurons, setTotalNeurons] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const executionEngine = useExecution({
    neuronCount: totalNeurons,
    episodeCount: totalEpisodes,
    workspaceId: currentWorkspace?.id ?? null,
  });
  const { suggestions: decisionSuggestions } = useAgentDecisionEngine();

  // ═══ UI state ═══
  const initialQ = searchParams.get("q") || "";
  const [input, setInput] = useState(initialQ);
  const [files, setFiles] = useState<File[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showOutputs, setShowOutputs] = useState(false);
  const [showPostExecution, setShowPostExecution] = useState(false);
  const [showEconomicGate, setShowEconomicGate] = useState(false);
  const [permissionBlock, setPermissionBlock] = useState<RouteResult | null>(null);
  const [savingAllOutputs, setSavingAllOutputs] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<RouteResult | null>(null);
  const [activeLayer, setActiveLayer] = useState<WorkspaceLayer>("chat");
  const [showLowBalance, setShowLowBalance] = useState(false);

  // Auto-trigger low balance gate when balance hits 0 after execution
  useEffect(() => {
    if (balance <= 0 && execState.phase === "completed" && !showLowBalance) {
      const timer = setTimeout(() => setShowLowBalance(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [balance, execState.phase, showLowBalance]);

  const inputZoneRef = useRef<CommandInputZoneRef>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useOnboardingRedirect();

  // ═══ Realtime step tracking ═══
  useRealtimeSteps({
    actionId: execState.actionId,
    enabled: execState.phase === "executing" || execState.phase === "delivering",
    onStepUpdate: executionActions.updateStep,
    onAllCompleted: () => {
      if (execState.phase === "executing") executionActions.transition("delivering");
    },
  });

  // Auto-switch to execution layer when execution starts
  useEffect(() => {
    if (execState.phase === "planning" || execState.phase === "executing") {
      setActiveLayer("chat"); // keep chat visible during execution — ContextDrawer shows execution details
    }
  }, [execState.phase]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputZoneRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (loading) { abortRef.current?.abort(); executionActions.setLoading(false); executionActions.setStreaming(false); }
        else if (showOutputs) setShowOutputs(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, showOutputs]);

  // ═══ Load session on mount ═══
  useEffect(() => {
    if (!user || sessionLoaded) return;
    setSessionLoaded(true);
    loadCurrentSession().then((loaded) => {
      if (loaded.length > 0) executionActions.setMessages(loaded);
    });
  }, [user, sessionLoaded, loadCurrentSession]);

  // ═══ Auto-submit from ?q= ═══
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (initialQ && user && sessionLoaded && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => inputZoneRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [initialQ, user, sessionLoaded, setSearchParams]);

  useEffect(() => {
    if (!user || !currentWorkspace) return;
    const wsId = currentWorkspace.id;
    Promise.all([
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("workspace_id", wsId),
    ]).then(([n, e]) => {
      setTotalNeurons(n.count ?? 0);
      setTotalEpisodes(e.count ?? 0);
    });
  }, [user, currentWorkspace]);

  // ═══ Auto-scroll ═══
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ═══ Parse outputs ═══
  const parseOutputs = useCallback((content: string): OutputItem[] => {
    const items: OutputItem[] = [];
    const sections = content.split(/^## /m).filter(Boolean);
    if (sections.length > 1) {
      sections.forEach((section, i) => {
        const lines = section.split("\n");
        const title = lines[0]?.trim() || `Section ${i + 1}`;
        const body = lines.slice(1).join("\n").trim();
        if (body.length > 50) {
          let type: OutputItem["type"] = "raw";
          const lower = title.toLowerCase();
          if (lower.includes("transcript")) type = "transcript";
          else if (lower.includes("summary") || lower.includes("rezumat")) type = "summary";
          else if (lower.includes("insight") || lower.includes("key")) type = "insights";
          else if (lower.includes("framework") || lower.includes("pattern")) type = "frameworks";
          else if (lower.includes("action") || lower.includes("plan") || lower.includes("next")) type = "action_plan";
          else if (lower.includes("article") || lower.includes("content") || lower.includes("post")) type = "content";
          items.push({ id: `output-${i}`, type, title, content: body });
        }
      });
    }
    if (items.length === 0 && content.length > 100) {
      items.push({ id: "output-full", type: "raw", title: "Execution Output", content });
    }
    return items;
  }, []);

  // ═══ SUBMIT ═══
  const handleSubmit = async (autoExec = false) => {
    if (!input.trim() && files.length === 0) return;
    if (!user) return;

    const rawInput = input.trim();
    setInput("");
    setFiles([]);
    setShowOutputs(false);
    setShowPostExecution(false);
    setPermissionBlock(null);

    try {
      const { route, isExecution } = await executionEngine.execute(rawInput, files, { autoExecute: autoExec });

      if (!route.permitted) {
        setPermissionBlock(route);
        logPermissionDenied(user.id, route.intent.category, route.intent.requiredTier, tier);
        return;
      }

      setPendingRoute(route);
      saveMessage({ id: crypto.randomUUID(), role: "user", content: rawInput, timestamp: new Date() });

      if (isExecution && execState.phase === "confirming" && route.intent.confidence < 0.9 && !autoExec) {
        // Show plan preview, wait for user confirmation
        return;
      }

      if (isExecution) {
        // Real service execution path
        await executionEngine.confirmAndRun(rawInput, route);
      } else {
        // Chat/conversation path — delegate to useExecution streaming
        executionActions.transition("planning");
        executionActions.setLoading(true);
        executionActions.setStreaming(true);

        // Process file uploads
        let fileContent = "";
        for (const file of files) {
          if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".csv") || file.name.endsWith(".json")) {
            fileContent += `\n--- ${file.name} ---\n` + await file.text();
          } else if (file.type.startsWith("audio/") || file.type.startsWith("video/") || file.name.match(/\.(mp3|mp4|wav|m4a|webm|ogg)$/i)) {
            const filePath = `chat-uploads/${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadErr } = await supabase.storage.from("user-uploads").upload(filePath, file);
            if (uploadErr) {
              fileContent += `\n[Upload failed: ${file.name} — ${uploadErr.message}]`;
            } else {
              const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(filePath);
              fileContent += `\n[Uploaded: ${file.name} → ${urlData.publicUrl}]`;
            }
          } else {
            fileContent += `\n[File attached: ${file.name} (${file.type || 'unknown'}, ${(file.size / 1024).toFixed(0)} KB)]`;
          }
        }

        const contentWithFiles = rawInput + fileContent;
        await executionEngine.streamAgentResponse(contentWithFiles, route, new AbortController().signal);
      }

      // Post-execution: persist and show outputs
      const currentOutputs = store.outputs;
      if (currentOutputs.length > 0) {
        setShowOutputs(true);
      }
      executionActions.completeExecution();
      setShowPostExecution(true);

      if (user) {
        const startTime = execState.startedAt ? new Date(execState.startedAt).getTime() : Date.now();
        logExecutionCompleted(user.id, execState.actionId, execState.intent, execState.totalCredits, currentOutputs.length, Date.now() - startTime);
        persistRun({ execution: { ...execState, phase: "completed", completedAt: new Date().toISOString() }, outputCount: currentOutputs.length });
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        executionActions.failExecution(e instanceof Error ? e.message : "Unknown error");
        toast.error(t("errors:agent_error", { message: e instanceof Error ? e.message : "Unknown" }));
      }
    } finally {
      executionActions.setLoading(false);
      executionActions.setStreaming(false);
      abortRef.current = null;
    }
  };

  // ═══ Handlers ═══
  const handleStop = () => { executionEngine.stop(); };

  const clearChat = () => {
    newSession(); executionActions.reset();
    executionActions.clearMessages();
    executionActions.setOutputs([]); setShowOutputs(false); setShowPostExecution(false);
  };

  const handleSaveAllOutputs = async () => {
    if (outputs.length === 0) return;
    setSavingAllOutputs(true);
    const count = await persistOutputsBatch(outputs.map(o => ({ title: o.title, content: o.content, type: o.type })), [execState.intent]);
    setSavingAllOutputs(false);
    toast[count > 0 ? "success" : "error"](count > 0 ? `Saved ${count} outputs as assets` : "Failed to save outputs");
  };

  const handleSaveTemplate = async () => {
    if (!user || execState.phase !== "completed") return;
    try {
      const { error } = await supabase.from("agent_plan_templates").insert({
        intent_key: execState.intent, name: `${execState.planName} (saved)`,
        description: execState.objective,
        steps: execState.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })) as any,
        estimated_credits: execState.totalCredits, estimated_duration_seconds: execState.steps.length * 5, is_default: false,
      });
      if (error) throw error;
      toast.success("Workflow saved as template");
    } catch { toast.error("Failed to save template"); }
  };

  const handleRerun = () => {
    const lastUser = messages.filter(m => m.role === "user").pop();
    if (lastUser) { setInput(lastUser.content); inputZoneRef.current?.focus(); }
  };

  const handleCommand = (prompt: string, autoExec = false) => {
    setInput(prompt);
    if (autoExec) {
      setTimeout(() => { handleSubmit(true); }, 50);
    } else {
      inputZoneRef.current?.focus();
    }
  };

  // ═══ Derived ═══
  const isEmptyState = messages.length === 0 && !loading;
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "Noapte bună" : hour < 12 ? "Bună dimineața" : hour < 18 ? "Bună ziua" : "Bună seara";
  const userName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const durationSeconds =
    execState.startedAt && execState.completedAt
      ? Math.round((new Date(execState.completedAt).getTime() - new Date(execState.startedAt).getTime()) / 1000)
      : 0;

  if (authLoading) return <HomeSkeleton />;

  return (
    <>
      <WelcomeModal />
      <SEOHead title={`${t("pages:home.cockpit")} — AI-IDEI`} description={t("pages:home.cockpit_desc")} />

      <div className="flex-1 flex h-[calc(100vh-var(--header-height,56px))] overflow-hidden relative">
        {/* ═══ CENTER: Execution Surface ═══ */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* No ambient glow — clean fixed layout */}

          {/* Workspace Layer Tabs */}
          <WorkspaceLayerTabs
            active={activeLayer}
            onChange={setActiveLayer}
            executionActive={execState.phase !== "idle"}
          />

          {/* Execution Status Bar */}
          <ExecutionStatusBar
            phase={execState.phase} intent={execState.intent}
            totalCredits={execState.totalCredits}
            stepsCompleted={execState.steps.filter(s => s.status === "completed").length}
            totalSteps={execState.steps.length}
            startedAt={execState.startedAt} errorMessage={execState.errorMessage}
          />

          {/* Permission gate */}
          <AnimatePresence>
            {permissionBlock && (
              <PermissionGate
                intent={permissionBlock.intent.category}
                requiredTier={permissionBlock.intent.requiredTier}
                currentTier={tier}
                onDismiss={() => setPermissionBlock(null)}
              />
            )}
          </AnimatePresence>




          {/* ═══ CONTENT AREA ═══ */}
          <div className="flex-1 relative z-10 min-h-0 overflow-hidden">
            {/* TOP REGION — scrolls independently above the fixed center rail */}
            <div className="absolute inset-x-0 top-0 bottom-1/2 overflow-hidden">
              {isEmptyState ? (
                <div className="h-full flex flex-col items-center justify-end px-4 sm:px-6 pb-20">
                  <div className="w-full max-w-3xl flex flex-col items-center gap-4">
                    <div className="w-full text-center space-y-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] leading-[1.15] text-foreground">
                        {greeting},{" "}
                        <span className="bg-gradient-to-r from-primary via-primary/85 to-primary/70 bg-clip-text text-transparent">
                          {userName}
                        </span>
                      </h1>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Ce vrei să obții?
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div ref={scrollRef} className="h-full overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-32 space-y-4">
                    {messages.map((msg) => (
                      <CommandBubble
                        key={msg.id}
                        msg={msg}
                        isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
                        onRetry={msg.role === "assistant" ? handleRerun : undefined}
                      />
                    ))}

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
                            {execState.phase === "planning" ? "Planning..." : "Thinking..."}
                          </span>
                        </div>
                      </div>
                    )}

                    {(execState.phase === "completed" || execState.phase === "failed") && (
                      <ExecutionSummary
                        phase={execState.phase} intent={execState.intent}
                        planName={execState.planName} totalCredits={execState.totalCredits}
                        stepsCompleted={execState.steps.filter(s => s.status === "completed").length}
                        totalSteps={execState.steps.length} outputCount={outputs.length}
                        durationSeconds={durationSeconds} errorMessage={execState.errorMessage}
                        onSaveTemplate={handleSaveTemplate} onSaveAllOutputs={handleSaveAllOutputs}
                        onRerun={handleRerun} onViewOutputs={() => setShowOutputs(true)}
                      />
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* CENTER RAIL — the main chat stays here, never moves */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 px-4 sm:px-6 pointer-events-none">
              <div className="max-w-3xl mx-auto pointer-events-auto">
                <CommandInputZone
                  ref={inputZoneRef} input={input} onInputChange={setInput}
                  onSubmit={handleSubmit} onStop={handleStop} loading={loading}
                  files={files} onFileSelect={(e) => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); }}
                  onRemoveFile={(idx) => setFiles(prev => prev.filter((_, i) => i !== idx))}
                  showSlashMenu={showSlashMenu} onShowSlashMenuChange={setShowSlashMenu}
                  onSlashSelect={(cmd) => { setInput(cmd); inputZoneRef.current?.focus(); }}
                  onAttachAction={(action) => {
                    const actionPrompts: Record<string, string> = {
                      extract_neurons: "/extract neurons from content",
                      generate_content: "/generate content from neurons",
                      analyze_data: "/analyze my data and competitors",
                      build_funnel: "/build a sales funnel",
                      trending: "/analyze trending patterns in my library",
                      recommended: "/suggest next best actions based on my data",
                    };
                    const prompt = actionPrompts[action];
                    if (prompt) handleCommand(prompt, true);
                  }}
                />
              </div>
            </div>

            {/* BOTTOM REGION — menus/panels open around the fixed rail, below it */}
            <div className="absolute inset-x-0 top-1/2 bottom-0 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-6">
                  {isEmptyState && input.length >= 2 && (
                    <SystemRecommendations
                      systems={matchIntentToSystems(input)}
                      input={input}
                      onSelect={(sys: MMSystem) => handleCommand(sys.prompt, true)}
                    />
                  )}

                  {isEmptyState && input.length < 2 && (
                  <div className="w-full max-w-2xl mx-auto">
                      <IntentChips onSelect={(prompt) => { setInput(prompt); inputZoneRef.current?.focus(); }} />
                  </div>
                  )}

                  <AnimatePresence>
                    {execState.phase === "confirming" && execState.totalCredits > 0 && !showEconomicGate && (
                      <div className="pb-2">
                        <PlanPreview
                          plan={{
                            action_id: execState.actionId, intent: execState.intent,
                            confidence: execState.confidence, plan_name: execState.planName,
                            total_credits: execState.totalCredits,
                            steps: execState.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })),
                            objective: execState.objective, output_preview: execState.outputPreview,
                          }}
                          balance={balance}
                          onExecute={async () => {
                            if (execState.totalCredits > 50) { setShowEconomicGate(true); }
                            else if (pendingRoute) {
                              const lastUserMsg = messages.filter(m => m.role === "user").pop();
                              await executionEngine.confirmAndRun(lastUserMsg?.content || "", pendingRoute);
                            }
                          }}
                          onEdit={() => { setInput(`Refine plan: ${execState.intent}`); inputZoneRef.current?.focus(); }}
                          onDismiss={() => executionActions.reset()}
                          executing={loading}
                        />
                      </div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showEconomicGate && execState.phase === "confirming" && (
                      <div className="pb-2">
                        <EconomicGate
                          balance={balance} estimatedCost={execState.totalCredits}
                          tierDiscount={tierDiscount} tier={tier}
                          onProceed={async () => {
                            setShowEconomicGate(false);
                            if (pendingRoute) {
                              const lastUserMsg = messages.filter(m => m.role === "user").pop();
                              await executionEngine.confirmAndRun(lastUserMsg?.content || "", pendingRoute);
                            }
                          }}
                          onCancel={() => { setShowEconomicGate(false); if (user) logEconomicGate(user.id, false, balance, execState.totalCredits, tierDiscount); executionActions.reset(); }}
                        />
                      </div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showOutputs && outputs.length > 0 && (
                      <div className="pb-2">
                        <OutputPanel outputs={outputs} visible={showOutputs} onRerun={handleRerun}
                          onClose={() => setShowOutputs(false)} onSaveAll={handleSaveAllOutputs} savingAll={savingAllOutputs} />
                      </div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {execState.phase === "completed" && showPostExecution && (
                      <div className="pb-2">
                        <PostExecutionPanel
                          intent={execState.intent as any} creditsSpent={execState.totalCredits}
                          outputCount={outputs.length}
                          onAction={(prompt) => { setInput(prompt); setShowPostExecution(false); inputZoneRef.current?.focus(); }}
                          onSaveTemplate={handleSaveTemplate} onDismiss={() => setShowPostExecution(false)} userTier={tier}
                        />
                      </div>
                    )}
                  </AnimatePresence>

                  {!isEmptyState && (
                    <div className="flex justify-center py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearChat}
                        className="h-7 px-3 text-[11px] text-muted-foreground/50 hover:text-foreground gap-1.5"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Sesiune nouă
                      </Button>
                    </div>
                  )}

                  {!isEmptyState && !loading && input.length >= 2 && (
                    <div className="pb-1">
                      <SystemRecommendations
                        systems={matchIntentToSystems(input)}
                        input={input}
                        onSelect={(sys: MMSystem) => handleCommand(sys.prompt, true)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Context Drawer (on demand) ═══ */}
        <ContextDrawer
          execution={execState}
          outputs={outputs}
          balance={balance}
          onSaveTemplate={handleSaveTemplate}
          onViewOutputs={() => setShowOutputs(true)}
          onRerun={handleRerun}
        />
      </div>

      {/* ═══ LOW BALANCE GATE — auto-triggered ═══ */}
      <AnimatePresence>
        {showLowBalance && (
          <LowBalanceGate balance={balance} onDismiss={() => setShowLowBalance(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
