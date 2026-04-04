/**
 * useCommandCenter — Extracted hook for /home Command Center.
 * All state, handlers, effects, and derived values in one place.
 * CC-T06: Reduces Home.tsx from 800+ lines to ~300 lines of layout.
 */
import { useState, useRef, useEffect, useCallback } from "react";
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
import { type MMSystem } from "@/components/command-center/IntentSystems";
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

export function useCommandCenter() {
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

  // Keyboard shortcuts
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

  // Load session on mount
  useEffect(() => {
    if (!user || sessionLoaded) return;
    setSessionLoaded(true);
    loadCurrentSession().then((loaded) => {
      if (loaded.length > 0) executionActions.setMessages(loaded);
    });
  }, [user, sessionLoaded, loadCurrentSession]);

  // Auto-submit from ?q= — CC-R02: actually execute, not just focus
  useEffect(() => {
    if (initialQ && user && sessionLoaded && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      setSearchParams({}, { replace: true });
      // Defer to next tick so input state is settled
      const timer = setTimeout(() => {
        handleSubmit(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialQ, user, sessionLoaded, setSearchParams]);

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

  // ═══ SUBMIT ═══
  const handleSubmit = async (autoExec = false) => {
    if (!input.trim() && files.length === 0) return;
    if (!user) return;
    if (isSubmitting) return;

    // Validate input length (max 50K chars)
    if (input.trim().length > 50000) {
      toast.error(t("errors:input_too_long", { defaultValue: "Message is too long (max 50,000 characters)" }));
      return;
    }

    // Validate files
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const MAX_FILES = 10;
    const BLOCKED_EXTENSIONS = [".exe", ".bat", ".sh", ".dll", ".bin"];
    
    if (files.length > MAX_FILES) {
      toast.error(t("errors:too_many_files", { defaultValue: `Maximum ${MAX_FILES} files allowed` }));
      return;
    }
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("errors:file_too_large", { defaultValue: `"${file.name}" exceeds 20MB limit` }));
        return;
      }
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        toast.error(t("errors:file_type_blocked", { defaultValue: `"${file.name}" — file type not supported` }));
        return;
      }
    }

    setIsSubmitting(true);

    const rawInput = input.trim();
    setInput("");
    setFiles([]);
    setShowOutputs(false);
    setShowPostExecution(false);
    setPermissionBlock(null);

    // CC-V02: Track submission
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
        if (user) logEconomicGate(user.id, false, balance, route.intent.estimatedCredits, tierDiscount);
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

        // CC-R01: Persist AbortController before stream starts
        const controller = new AbortController();
        abortRef.current = controller;

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
        await executionEngine.streamAgentResponse(contentWithFiles, route, controller.signal);

        // CC-R04: Read fresh state from store after stream completes, not stale closures
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
    }
  };

  // ═══ Handlers ═══
  const handleStop = useCallback(() => { stopActiveExecution(); }, [stopActiveExecution]);

  const clearChat = () => {
    trackSessionAction("started");
    newSession(); executionActions.reset();
    executionActions.clearMessages();
    executionActions.setOutputs([]); setShowOutputs(false); setShowPostExecution(false);
  };

  const handleSaveAllOutputs = async () => {
    if (outputs.length === 0) return;
    setSavingAllOutputs(true);
    const count = await persistOutputsBatch(outputs.map(o => ({ title: o.title, content: o.content, type: o.type })), [execState.intent]);
    setSavingAllOutputs(false);
    trackOutputEngagement("save_all", outputs.length);
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

  const handlePipelineMessage = useCallback((role: "user" | "assistant", content: string, meta?: Record<string, any>) => {
    const msg = { id: crypto.randomUUID(), role, content, timestamp: new Date(), ...(meta ? { metadata: meta } : {}) };
    saveMessage(msg as any);
    executionActions.addMessage(msg as any);
  }, [saveMessage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleRemoveFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleAttachAction = (action: string) => {
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
  };

  const handlePlanExecute = async () => {
    if (execState.totalCredits > 50) {
      setShowEconomicGate(true);
      trackEconomicGate("shown", balance, execState.totalCredits);
    } else if (pendingRoute) {
      const lastUserMsg = messages.filter(m => m.role === "user").pop();
      await executionEngine.confirmAndRun(lastUserMsg?.content || "", pendingRoute);
    }
  };

  const handleEconomicProceed = async () => {
    setShowEconomicGate(false);
    trackEconomicGate("proceed", balance, execState.totalCredits);
    if (pendingRoute) {
      const lastUserMsg = messages.filter(m => m.role === "user").pop();
      await executionEngine.confirmAndRun(lastUserMsg?.content || "", pendingRoute);
    }
  };

  const handleEconomicCancel = () => {
    setShowEconomicGate(false);
    trackEconomicGate("cancel", balance, execState.totalCredits);
    if (user) logEconomicGate(user.id, false, balance, execState.totalCredits, tierDiscount);
    executionActions.reset();
  };

  // ═══ Derived ═══
  const isEmptyState = messages.length === 0 && !loading;
  const hour = new Date().getHours();
  const greeting = hour < 6
    ? t("common:greeting_night", { defaultValue: "Good night" })
    : hour < 12
    ? t("common:greeting_morning", { defaultValue: "Good morning" })
    : hour < 18
    ? t("common:greeting_afternoon", { defaultValue: "Good afternoon" })
    : t("common:greeting_evening", { defaultValue: "Good evening" });
  const userName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const durationSeconds =
    execState.startedAt && execState.completedAt
      ? Math.round((new Date(execState.completedAt).getTime() - new Date(execState.startedAt).getTime()) / 1000)
      : 0;

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
    onSlashSelect: (cmd: string) => { setInput(cmd); inputZoneRef.current?.focus(); },
    // t
    t,
  };
}
