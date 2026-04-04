/**
 * useCommandCenter — Extracted hook for /home Command Center.
 * Refactored (A2): file handling → chatFileService, session → chatSessionService.
 * Fixes: A1 (quick-exec), A4 (debounce), A5 (persistence), A9 (cleanup).
 */
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { CommandMode } from "@/components/command-center/ModeChipBar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useExecutionStore, executionActions, getExecutionState, type Message } from "@/stores/executionStore";
import { useExecutionHistory } from "@/hooks/useExecutionHistory";
import { useRealtimeSteps } from "@/hooks/useRealtimeSteps";
import { useAgentDecisionEngine } from "@/hooks/useAgentDecisionEngine";
import { useUserTier } from "@/hooks/useUserTier";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { useExecution } from "@/hooks/useExecution";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type OutputItem } from "@/stores/executionStore";
import { type CommandInputZoneRef } from "@/components/command-center/CommandInputZone";
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
import {
  validateFiles, validateInput, processFilesForPrompt,
} from "@/services/chatFileService";
import {
  persistMessages, restoreMessages, clearPersistedMessages,
  persistOutputs, restoreOutputs,
  saveDraft, restoreDraft, clearDraft,
} from "@/services/chatSessionService";

// ═══ Quick-exec threshold (A1): plans under this cost skip EconomicGate ═══
const QUICK_EXEC_CREDIT_THRESHOLD = 50;

export function useCommandCenter() {
  const { isOnline } = useOnlineStatus();
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
  const initialQ = searchParams.get("q") || "";
  const [input, setInput] = useState(initialQ || restoreDraft());
  const [files, setFiles] = useState<File[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showOutputs, setShowOutputs] = useState(false);
  const [showPostExecution, setShowPostExecution] = useState(false);
  const [showEconomicGate, setShowEconomicGate] = useState(false);
  const [permissionBlock, setPermissionBlock] = useState<RouteResult | null>(null);
  const [savingAllOutputs, setSavingAllOutputs] = useState(false);
  const [activeMode, setActiveMode] = useState<CommandMode>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<RouteResult | null>(null);
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ═══ Refs ═══
  const inputZoneRef = useRef<CommandInputZoneRef>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSubmittedRef = useRef(false);

  // ═══ Lifecycle hooks ═══
  useOnboardingRedirect();

  // Cleanup AbortController on unmount (A9)
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  // Persist draft input (A5)
  useEffect(() => {
    saveDraft(input);
  }, [input]);

  // Persist messages whenever they change (A5)
  useEffect(() => {
    if (messages.length > 0) {
      persistMessages(messages);
    }
  }, [messages]);

  // Persist outputs whenever they change (A5)
  useEffect(() => {
    if (outputs.length > 0) {
      persistOutputs(outputs);
    }
  }, [outputs]);

  // Auto-trigger low balance gate
  useEffect(() => {
    if (balance <= 0 && execState.phase === "completed" && !showLowBalance) {
      const timer = setTimeout(() => setShowLowBalance(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [balance, execState.phase, showLowBalance]);

  // Realtime step tracking
  useRealtimeSteps({
    actionId: execState.actionId,
    enabled: execState.phase === "executing" || execState.phase === "delivering",
    onStepUpdate: executionActions.updateStep,
    onAllCompleted: () => {
      if (execState.phase === "executing") executionActions.transition("delivering");
    },
  });

  // ═══ Unified stop routine ═══
  const stopActiveExecution = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    executionEngine.stop();
    executionActions.setLoading(false);
    executionActions.setStreaming(false);
  }, [executionEngine]);

  // Keyboard shortcuts (with proper cleanup — A9)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputZoneRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (loading || isStreaming) { stopActiveExecution(); }
        else if (showOutputs) setShowOutputs(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, isStreaming, showOutputs, stopActiveExecution]);

  // Load session on mount (A5: also restore persisted messages/outputs)
  useEffect(() => {
    if (!user || sessionLoaded) return;
    setSessionLoaded(true);
    loadCurrentSession().then((loaded) => {
      if (loaded.length > 0) {
        executionActions.setMessages(loaded);
      } else {
        // Try restoring from sessionStorage
        const restored = restoreMessages();
        if (restored.length > 0) executionActions.setMessages(restored);
        const restoredOutputs = restoreOutputs();
        if (restoredOutputs.length > 0) executionActions.setOutputs(restoredOutputs);
      }
    });
  }, [user, sessionLoaded, loadCurrentSession]);

  // Auto-submit from ?q=
  useEffect(() => {
    if (initialQ && user && sessionLoaded && !tierLoading && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => {
        handleSubmit(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialQ, user, sessionLoaded, tierLoading, setSearchParams]);

  // Fetch neuron/episode counts
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

  // Auto-scroll
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ═══ SUBMIT (A4: isSubmitting guard prevents double-submit) ═══
  const handleSubmit = useCallback(async (autoExec = false) => {
    if (!input.trim() && files.length === 0) return;
    if (!user) return;
    if (isSubmitting) return;
    if (!isOnline) {
      toast.error("You're offline. Please check your connection.");
      return;
    }

    // Validate input length
    const inputValidation = validateInput(input.trim());
    if (!inputValidation.valid) {
      toast.error(t(inputValidation.errorKey!, { defaultValue: inputValidation.errorDefault }));
      return;
    }

    // Validate files (A8: pre-upload validation)
    const fileValidation = validateFiles(files);
    if (!fileValidation.valid) {
      toast.error(t(fileValidation.errorKey!, { defaultValue: fileValidation.errorDefault }));
      return;
    }

    setIsSubmitting(true);

    const rawInput = input.trim();
    setInput("");
    setFiles([]);
    clearDraft();
    setShowOutputs(false);
    setShowPostExecution(false);
    setPermissionBlock(null);

    trackCommandSubmitted(rawInput, files.length, autoExec);

    try {
      const { route, isExecution } = await executionEngine.execute(rawInput, files, { autoExecute: autoExec });

      if (!route.permitted) {
        setPermissionBlock(route);
        logPermissionDenied(user.id, route.intent.category, route.intent.requiredTier, tier);
        return;
      }

      // Check if intent is blocked (insufficient balance)
      if (route.intent.blocked) {
        setPendingRoute(route);
        saveMessage({ id: crypto.randomUUID(), role: "user", content: rawInput, timestamp: new Date() });
        executionActions.setPlan({
          actionId: null,
          intent: route.intent.category,
          confidence: route.intent.confidence,
          planName: route.intent.label,
          totalCredits: route.intent.estimatedCredits,
          steps: [],
          objective: route.intent.description,
        });
        setShowEconomicGate(true);
        logEconomicGate(user.id, false, balance, route.intent.estimatedCredits, tierDiscount);
        return;
      }

      setPendingRoute(route);
      saveMessage({ id: crypto.randomUUID(), role: "user", content: rawInput, timestamp: new Date() });

      if (isExecution && execState.phase === "confirming" && route.intent.confidence < 0.9 && !autoExec) {
        return;
      }

      if (isExecution) {
        await executionEngine.confirmAndRun(rawInput, route);
      } else {
        executionActions.transition("planning");
        executionActions.setLoading(true);
        executionActions.setStreaming(true);

        const controller = new AbortController();
        abortRef.current = controller;

        // A2: File processing extracted to service
        const fileContent = await processFilesForPrompt(files, user.id);
        const contentWithFiles = rawInput + fileContent;
        await executionEngine.streamAgentResponse(contentWithFiles, route, controller.signal);

        // Read fresh state after stream completes
        const freshState = getExecutionState();
        const freshOutputs = freshState.outputs;
        const freshExec = freshState.execution;

        executionActions.setStreaming(false);
        executionActions.setLoading(false);

        if (freshOutputs.length > 0) {
          setShowOutputs(true);
        }
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
        toast.error(t("errors:agent_error", { message: classified.message }));
      }
    } finally {
      executionActions.setLoading(false);
      executionActions.setStreaming(false);
      abortRef.current = null;
      setIsSubmitting(false);
    }
  }, [input, files, user, isSubmitting, executionEngine, execState, balance, tier, tierDiscount, t, saveMessage, persistRun]);

  // ═══ Handlers (memoized — A9: reduce re-renders) ═══
  const handleStop = useCallback(() => { stopActiveExecution(); }, [stopActiveExecution]);

  const clearChat = useCallback(() => {
    trackSessionAction("started");
    newSession();
    executionActions.reset();
    executionActions.clearMessages();
    executionActions.setOutputs([]);
    setShowOutputs(false);
    setShowPostExecution(false);
    clearDraft();
    clearPersistedMessages();
    // A10: ensure we stay on /home
    navigate("/home", { replace: true });
  }, [newSession, navigate]);

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
        intent_key: execState.intent,
        name: `${execState.planName} (saved)`,
        description: execState.objective,
        steps: execState.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })) as any,
        estimated_credits: execState.totalCredits,
        estimated_duration_seconds: execState.steps.length * 5,
        is_default: false,
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
      setInput(lastUser.content);
      inputZoneRef.current?.focus();
    }
  }, [messages]);

  const handleCommand = useCallback((prompt: string, autoExec = false) => {
    setInput(prompt);
    if (autoExec) {
      setTimeout(() => { handleSubmit(true); }, 50);
    } else {
      inputZoneRef.current?.focus();
    }
  }, [handleSubmit]);

  const handlePipelineMessage = useCallback((role: "user" | "assistant", content: string, meta?: Record<string, any>) => {
    const msgId = crypto.randomUUID();
    const msg = { id: msgId, role, content, timestamp: new Date(), ...(meta ? { metadata: meta } : {}) };
    // A5 fix: check for duplicate before adding
    const existing = getExecutionState().messages;
    const isDuplicate = existing.some(m => m.role === role && m.content === content && 
      Math.abs(new Date(m.timestamp).getTime() - Date.now()) < 2000);
    if (!isDuplicate) {
      saveMessage(msg as any);
      executionActions.addMessage(msg as any);
    }
  }, [saveMessage]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => {
        const combined = [...prev, ...newFiles];
        // Enforce max files limit immediately
        if (combined.length > 10) {
          toast.error(t("errors:too_many_files", { defaultValue: `Maximum 10 files allowed` }));
          return prev;
        }
        return combined;
      });
    }
  }, [t]);

  const handleRemoveFile = useCallback((idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

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

  // A1: Quick-exec for cheap plans, EconomicGate only for expensive ones
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

  const onSlashSelect = useCallback((cmd: string) => {
    setInput(cmd);
    inputZoneRef.current?.focus();
  }, []);

  // ═══ Derived (memoized) ═══
  const isEmptyState = useMemo(() => messages.length === 0 && !loading, [messages.length, loading]);
  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return t("common:greeting_night", { defaultValue: "Good night" });
    if (hour < 12) return t("common:greeting_morning", { defaultValue: "Good morning" });
    if (hour < 18) return t("common:greeting_afternoon", { defaultValue: "Good afternoon" });
    return t("common:greeting_evening", { defaultValue: "Good evening" });
  }, [t]);

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
    input, setInput, files, showSlashMenu, setShowSlashMenu,
    showOutputs, setShowOutputs, showPostExecution, setShowPostExecution,
    showEconomicGate, permissionBlock, setPermissionBlock,
    savingAllOutputs, showLowBalance, setShowLowBalance,
    activeMode, setActiveMode,
    isEmptyState, greeting, userName, durationSeconds,
    isSubmitting,
    // Counts
    totalNeurons, totalEpisodes,
    // Suggestions
    decisionSuggestions,
    // Refs
    inputZoneRef, scrollRef, messagesEndRef,
    // Handlers
    handleSubmit, handleStop, clearChat,
    handleSaveAllOutputs, handleSaveTemplate, handleRerun,
    handleCommand, handleFileSelect, handleRemoveFile,
    handleAttachAction, handlePlanExecute,
    handleEconomicProceed, handleEconomicCancel,
    handlePipelineMessage,
    // Slash
    onSlashSelect,
    // t
    t,
  };
}
