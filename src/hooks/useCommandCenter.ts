/**
 * useCommandCenter — Orchestrator hook for /home Command Center.
 * Delegates to sub-hooks: useCommandInput, useCommandSession.
 * Handles execution, economic gates, and keyboard shortcuts.
 */
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { CommandMode } from "@/components/command-center/ModeChipBar";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useExecutionStore, executionActions, getExecutionState, type Message } from "@/stores/executionStore";
import { useExecutionHistory } from "@/hooks/useExecutionHistory";
import { useRealtimeSteps } from "@/hooks/useRealtimeSteps";
import { useAgentDecisionEngine } from "@/hooks/useAgentDecisionEngine";
import { useUserTier } from "@/hooks/useUserTier";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { useExecution } from "@/hooks/useExecution";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type RouteResult } from "@/components/command-center/CommandRouter";
import {
  logCommandSubmitted, logPlanConfirmed, logExecutionCompleted,
  logPermissionDenied, logEconomicGate,
} from "@/components/command-center/AuditLogger";
import {
  trackCommandSubmitted, trackFirstToken, trackExecutionCompleted,
  trackExecutionFailed, trackOutputEngagement, trackEconomicGate,
  trackSessionAction, trackError,
} from "@/lib/commandCenterTelemetry";
import { classifyError } from "@/components/command-center/ErrorRecoveryHandler";
import { processFilesForPrompt } from "@/services/chatFileService";
import { persistMessages, persistOutputs } from "@/services/chatSessionService";

import { useCommandInput } from "@/hooks/command-center/useCommandInput";
import { useCommandSession } from "@/hooks/command-center/useCommandSession";

const QUICK_EXEC_CREDIT_THRESHOLD = 50;

export function useCommandCenter() {
  const { isOnline } = useOnlineStatus();
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { balance } = useCreditBalance();
  const [searchParams, setSearchParams] = useSearchParams();

  // ═══ Sub-hooks ═══
  const initialQ = searchParams.get("q") || "";
  const cmd = useCommandInput(initialQ);
  const session = useCommandSession();

  const store = useExecutionStore();
  const { execution: execState, messages, outputs, loading, isStreaming } = store;
  const { persistRun, persistOutputsBatch } = useExecutionHistory();
  const { tier, loading: tierLoading } = useUserTier();
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
  const [showOutputs, setShowOutputs] = useState(false);
  const [showPostExecution, setShowPostExecution] = useState(false);
  const [showEconomicGate, setShowEconomicGate] = useState(false);
  const [permissionBlock, setPermissionBlock] = useState<RouteResult | null>(null);
  const [savingAllOutputs, setSavingAllOutputs] = useState(false);
  const [activeMode, setActiveMode] = useState<CommandMode>(null);
  const [pendingRoute, setPendingRoute] = useState<RouteResult | null>(null);
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ═══ Refs ═══
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSubmittedRef = useRef(false);

  // ═══ Lifecycle ═══
  useOnboardingRedirect();

  useEffect(() => {
    return () => { abortRef.current?.abort(); abortRef.current = null; };
  }, []);

  // Persist draft
  useEffect(() => { cmd.saveDraft(cmd.input); }, [cmd.input]);

  // Persist messages/outputs
  useEffect(() => { if (messages.length > 0) persistMessages(messages); }, [messages]);
  useEffect(() => { if (outputs.length > 0) persistOutputs(outputs); }, [outputs]);

  // Low balance gate
  useEffect(() => {
    if (balance <= 0 && execState.phase === "completed" && !showLowBalance) {
      const timer = setTimeout(() => setShowLowBalance(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [balance, execState.phase, showLowBalance]);

  // Realtime steps
  useRealtimeSteps({
    actionId: execState.actionId,
    enabled: execState.phase === "executing" || execState.phase === "delivering",
    onStepUpdate: executionActions.updateStep,
    onAllCompleted: () => {
      if (execState.phase === "executing") executionActions.transition("delivering");
    },
  });

  // ═══ Stop ═══
  const stopActiveExecution = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    executionEngine.stop();
    executionActions.setLoading(false);
    executionActions.setStreaming(false);
  }, [executionEngine]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        cmd.inputZoneRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (loading || isStreaming) stopActiveExecution();
        else if (showOutputs) setShowOutputs(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, isStreaming, showOutputs, stopActiveExecution, cmd.inputZoneRef]);

  // Fetch counts
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

  // Auto-submit from ?q=
  useEffect(() => {
    if (initialQ && user && session.sessionLoaded && !tierLoading && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => handleSubmit(true), 100);
      return () => clearTimeout(timer);
    }
  }, [initialQ, user, session.sessionLoaded, tierLoading, setSearchParams]);

  // Auto-scroll
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ═══ SUBMIT ═══
  const handleSubmit = useCallback(async (autoExec = false) => {
    if (!cmd.input.trim() && cmd.files.length === 0 && cmd.commands.length === 0) return;
    if (!user || isSubmitting) return;
    if (!isOnline) {
      toast.error("You're offline. Please check your connection.");
      return;
    }
    if (!cmd.validate()) return;

    setIsSubmitting(true);
    const rawInput = cmd.consumeInput();
    setShowOutputs(false);
    setShowPostExecution(false);
    setPermissionBlock(null);

    trackCommandSubmitted(rawInput, cmd.files.length, autoExec);

    try {
      const { route, isExecution } = await executionEngine.execute(rawInput, cmd.files, { autoExecute: autoExec });

      if (!route.permitted) {
        setPermissionBlock(route);
        logPermissionDenied(user.id, route.intent.category, route.intent.requiredTier, tier);
        return;
      }

      if (route.intent.blocked) {
        setPendingRoute(route);
        session.saveMessage({ id: crypto.randomUUID(), role: "user", content: rawInput, timestamp: new Date() });
        executionActions.setPlan({
          actionId: null, intent: route.intent.category,
          confidence: route.intent.confidence, planName: route.intent.label,
          totalCredits: route.intent.estimatedCredits, steps: [],
          objective: route.intent.description,
        });
        setShowEconomicGate(true);
        logEconomicGate(user.id, false, balance, route.intent.estimatedCredits, tierDiscount);
        return;
      }

      setPendingRoute(route);
      session.saveMessage({ id: crypto.randomUUID(), role: "user", content: rawInput, timestamp: new Date() });

      if (isExecution && execState.phase === "confirming" && route.intent.confidence < 0.9 && !autoExec) return;

      if (isExecution) {
        await executionEngine.confirmAndRun(rawInput, route);
      } else {
        executionActions.transition("planning");
        executionActions.setLoading(true);
        executionActions.setStreaming(true);

        const controller = new AbortController();
        abortRef.current = controller;

        const fileContent = await processFilesForPrompt(cmd.files, user.id);
        const contentWithFiles = rawInput + fileContent;
        await executionEngine.streamAgentResponse(contentWithFiles, route, controller.signal);

        const freshState = getExecutionState();
        const freshOutputs = freshState.outputs;
        const freshExec = freshState.execution;

        executionActions.setStreaming(false);
        executionActions.setLoading(false);

        if (freshOutputs.length > 0) setShowOutputs(true);
        executionActions.completeExecution();
        setShowPostExecution(true);

        if (user) {
          const startTime = freshExec.startedAt ? new Date(freshExec.startedAt).getTime() : Date.now();
          const durationMs = Date.now() - startTime;
          logExecutionCompleted(user.id, freshExec.actionId, freshExec.intent, freshExec.totalCredits, freshOutputs.length, durationMs);
          trackExecutionCompleted(freshExec.intent, freshExec.totalCredits, freshOutputs.length, durationMs);
          persistRun({ execution: { ...freshExec, phase: "completed", completedAt: new Date().toISOString() }, outputCount: freshOutputs.length });
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        const classified = classifyError(e);
        executionActions.failExecution(classified.message);
        trackExecutionFailed(execState.intent, classified.type);
        trackError(classified.type, classified.type !== "insufficient_credits");
        toast.error(cmd.t("errors:agent_error", { message: classified.message }));
      }
    } finally {
      executionActions.setLoading(false);
      executionActions.setStreaming(false);
      abortRef.current = null;
      setIsSubmitting(false);
    }
  }, [cmd.input, cmd.files, user, isSubmitting, isOnline, executionEngine, execState, balance, tier, tierDiscount, cmd, session, persistRun]);

  // ═══ Handlers ═══
  const handleStop = useCallback(() => stopActiveExecution(), [stopActiveExecution]);

  const handleSaveAllOutputs = useCallback(async () => {
    if (outputs.length === 0) return;
    setSavingAllOutputs(true);
    try {
      const count = await persistOutputsBatch(
        outputs.map(o => ({ title: o.title, content: o.content, type: o.type })),
        [execState.intent],
      );
      trackOutputEngagement("save_all", outputs.length);
      toast[count > 0 ? "success" : "error"](count > 0 ? `Saved ${count} outputs as assets` : "Failed to save outputs");
    } catch {
      toast.error("Failed to save outputs");
    } finally {
      setSavingAllOutputs(false);
    }
  }, [outputs, execState.intent, persistOutputsBatch]);

  const handleSaveTemplate = useCallback(async () => {
    if (!user || execState.phase !== "completed") return;
    try {
      const { error } = await supabase.from("agent_plan_templates").insert({
        intent_key: execState.intent, name: `${execState.planName} (saved)`,
        description: execState.objective,
        steps: execState.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })) as any,
        estimated_credits: execState.totalCredits,
        estimated_duration_seconds: execState.steps.length * 5, is_default: false,
      });
      if (error) throw error;
      toast.success("Workflow saved as template");
    } catch {
      toast.error("Failed to save template");
    }
  }, [user, execState]);

  const handleRerun = useCallback(() => {
    const lastUser = messages.filter(m => m.role === "user").pop();
    if (lastUser) {
      cmd.setInput(lastUser.content);
      cmd.inputZoneRef.current?.focus();
    }
  }, [messages, cmd]);

  const handleCommand = useCallback((prompt: string, autoExec = false) => {
    cmd.setInput(prompt);
    if (autoExec) {
      setTimeout(() => handleSubmit(true), 50);
    } else {
      cmd.inputZoneRef.current?.focus();
    }
  }, [handleSubmit, cmd]);

  const handlePipelineMessage = useCallback((role: "user" | "assistant", content: string, meta?: Record<string, any>) => {
    const msgId = crypto.randomUUID();
    const msg = { id: msgId, role, content, timestamp: new Date(), ...(meta ? { metadata: meta } : {}) };
    const existing = getExecutionState().messages;
    const isDuplicate = existing.some(m => m.role === role && m.content === content &&
      Math.abs(new Date(m.timestamp).getTime() - Date.now()) < 2000);
    if (!isDuplicate) {
      session.saveMessage(msg as any);
      executionActions.addMessage(msg as any);
    }
  }, [session]);

  const handleAttachAction = useCallback((action: string) => {
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
  }, [handleCommand]);

  const handlePlanExecute = useCallback(async () => {
    if (execState.totalCredits > QUICK_EXEC_CREDIT_THRESHOLD) {
      setShowEconomicGate(true);
      trackEconomicGate("shown", balance, execState.totalCredits);
    } else if (pendingRoute) {
      const lastUserMsg = messages.filter(m => m.role === "user").pop();
      await executionEngine.confirmAndRun(lastUserMsg?.content || "", pendingRoute);
    }
  }, [execState.totalCredits, balance, pendingRoute, messages, executionEngine]);

  const handleEconomicProceed = useCallback(async () => {
    setShowEconomicGate(false);
    trackEconomicGate("proceed", balance, execState.totalCredits);
    if (pendingRoute) {
      const lastUserMsg = messages.filter(m => m.role === "user").pop();
      await executionEngine.confirmAndRun(lastUserMsg?.content || "", pendingRoute);
    }
  }, [balance, execState.totalCredits, pendingRoute, messages, executionEngine]);

  const handleEconomicCancel = useCallback(() => {
    setShowEconomicGate(false);
    trackEconomicGate("cancel", balance, execState.totalCredits);
    if (user) logEconomicGate(user.id, false, balance, execState.totalCredits, tierDiscount);
    executionActions.reset();
  }, [balance, execState.totalCredits, user, tierDiscount]);

  // ═══ Derived ═══
  const isEmptyState = useMemo(() => messages.length === 0 && !loading, [messages.length, loading]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return cmd.t("common:greeting_night", { defaultValue: "Good night" });
    if (hour < 12) return cmd.t("common:greeting_morning", { defaultValue: "Good morning" });
    if (hour < 18) return cmd.t("common:greeting_afternoon", { defaultValue: "Good afternoon" });
    return cmd.t("common:greeting_evening", { defaultValue: "Good evening" });
  }, [cmd.t]);

  const userName = useMemo(() => {
    return user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  }, [user]);

  const durationSeconds = useMemo(() => {
    if (!execState.startedAt || !execState.completedAt) return 0;
    return Math.round((new Date(execState.completedAt).getTime() - new Date(execState.startedAt).getTime()) / 1000);
  }, [execState.startedAt, execState.completedAt]);

  return {
    // Auth
    user, authLoading, tier, tierDiscount, balance,
    // Store
    execState, messages, outputs, loading, isStreaming,
    // UI state
    input: cmd.input, setInput: cmd.setInput, files: cmd.files,
    commands: cmd.commands, handleRemoveCommand: cmd.handleRemoveCommand,
    showSlashMenu: cmd.showSlashMenu, setShowSlashMenu: cmd.setShowSlashMenu,
    showOutputs, setShowOutputs, showPostExecution, setShowPostExecution,
    showEconomicGate, permissionBlock, setPermissionBlock,
    savingAllOutputs, showLowBalance, setShowLowBalance,
    activeMode, setActiveMode,
    isEmptyState, greeting, userName, durationSeconds,
    isSubmitting, isOnline,
    // Counts
    totalNeurons, totalEpisodes,
    // Suggestions
    decisionSuggestions,
    // Sessions
    sessions: session.sessions, sessionId: session.sessionId,
    isLoadingSessions: session.isLoadingSessions,
    loadSession: session.loadSession, deleteSession: session.deleteSession,
    // Refs
    inputZoneRef: cmd.inputZoneRef, scrollRef, messagesEndRef,
    // Handlers
    handleSubmit, handleStop, clearChat: session.clearChat,
    handleSaveAllOutputs, handleSaveTemplate, handleRerun,
    handleCommand, handleFileSelect: cmd.handleFileSelect,
    handleRemoveFile: cmd.handleRemoveFile,
    handleAttachAction, handlePlanExecute,
    handleEconomicProceed, handleEconomicCancel,
    handlePipelineMessage,
    // Slash
    onSlashSelect: cmd.onSlashSelect,
    // t
    t: cmd.t,
  };
}
