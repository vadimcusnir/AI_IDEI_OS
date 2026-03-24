/**
 * Home — Unified Execution Hub.
 * Single interface: INPUT → CONTEXT → EXECUTE → OUTPUT.
 * Inspired by Claude/Perplexity/Manus patterns.
 */
import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { useExecution } from "@/hooks/useExecution";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useChatHistory, type ChatMessage } from "@/hooks/useChatHistory";
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
import {
  Coins, ArrowUp, Sparkles, PanelLeftOpen, History,
  RotateCcw, Square, Paperclip, X, PanelRightOpen, PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Command Center components
import { CommandBubble } from "@/components/command-center/CommandBubble";
import { type OutputItem } from "@/components/command-center/OutputPanel";
import { OutputPanel } from "@/components/command-center/OutputPanel";
import { PlanPreview } from "@/components/command-center/PlanPreview";
import { EconomicGate } from "@/components/command-center/EconomicGate";
import { PermissionGate } from "@/components/command-center/PermissionGate";
import { PostExecutionPanel } from "@/components/command-center/PostExecutionPanel";
import { ContextActions } from "@/components/command-center/ContextActions";
import { ExecutionStatusBar } from "@/components/command-center/ExecutionStatusBar";
import { PipelineComposer } from "@/components/command-center/PipelineComposer";
import { CommandInputZone, type CommandInputZoneRef } from "@/components/command-center/CommandInputZone";
import { ExecutionSummary } from "@/components/command-center/ExecutionSummary";
import { ChatHistorySidebar } from "@/components/command-center/ChatHistorySidebar";
import { ExecutionRightPanel } from "@/components/command-center/ExecutionRightPanel";
import { SuggestionTabs } from "@/components/command-center/SuggestionTabs";
import { WelcomeScreen } from "@/components/command-center/WelcomeScreen";
import { SidePanels } from "@/components/command-center/SidePanels";
import { InputAttachMenu } from "@/components/command-center/InputAttachMenu";
import { AgentSlashMenu } from "@/components/agent/AgentSlashMenu";
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

  // ═══ UI-only state (panels, menus — local) ═══
  const initialQ = searchParams.get("q") || "";
  const [input, setInput] = useState(initialQ);
  const [files, setFiles] = useState<File[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showTaskTree, setShowTaskTree] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showOutputs, setShowOutputs] = useState(false);
  const [showPostExecution, setShowPostExecution] = useState(false);
  const [showEconomicGate, setShowEconomicGate] = useState(false);
  const [permissionBlock, setPermissionBlock] = useState<RouteResult | null>(null);
  const [savingAllOutputs, setSavingAllOutputs] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<RouteResult | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

  // ═══ Keyboard shortcuts ═══
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputZoneRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (loading) { abortRef.current?.abort(); executionActions.setLoading(false); executionActions.setStreaming(false); }
        else if (showMemory) setShowMemory(false);
        else if (showOutputs) setShowOutputs(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, showMemory, showOutputs]);

  // ═══ Load session on mount ═══
  useEffect(() => {
    if (!user || sessionLoaded) return;
    setSessionLoaded(true);
    loadCurrentSession().then((loaded) => {
      if (loaded.length > 0) executionActions.setMessages(loaded);
    });
  }, [user, sessionLoaded, loadCurrentSession]);

  // ═══ Auto-submit from ?q= param ═══
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (initialQ && user && sessionLoaded && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      // Clean the URL param
      setSearchParams({}, { replace: true });
      // Auto-focus and let user see the input before submitting
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

  // ═══ SUBMIT — Routes through execution engine ═══
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
      setShowTaskTree(true);

      if (isExecution && execState.phase === "confirming" && route.intent.confidence < 0.9 && !autoExec) {
        // Plan preview shown — wait for user confirmation
        return;
      }

      if (isExecution) {
        // High confidence or auto-execute — run immediately
        await executionEngine.confirmAndRun(rawInput, route);
      } else {
        // Conversation/chat path — use existing agent-console stream
        executionActions.transition("planning");
        executionActions.setLoading(true);
        await executeCommand(rawInput, { id: crypto.randomUUID(), role: "user", content: rawInput, timestamp: new Date() });
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

  // ═══ Core execution pipeline ═══
  const executeCommand = async (userContent: string, _userMessage: Message) => {
    if (!user) return;
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

    const apiMessages = messages
      .filter(m => m.role !== "system")
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: "user", content: userContent + fileContent });

    const [neuronsAgg, episodesAgg, jobsAgg] = await Promise.all([
      supabase.from("neurons").select("content_category", { count: "exact" }).eq("author_id", user.id),
      supabase.from("episodes").select("id", { count: "exact" }).eq("author_id", user.id),
      supabase.from("neuron_jobs").select("worker_type, status").eq("author_id", user.id).eq("status", "completed").limit(100),
    ]);

    const topCategories = (neuronsAgg.data || []).reduce((acc: Record<string, number>, n: any) => {
      const cat = n.content_category || "general";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const workerTypes = (jobsAgg.data || []).reduce((acc: Record<string, number>, j: any) => {
      acc[j.worker_type] = (acc[j.worker_type] || 0) + 1;
      return acc;
    }, {});

    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch(AGENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        messages: apiMessages,
        context: {
          neuron_count: totalNeurons,
          episode_count: totalEpisodes,
          credit_balance: balance,
          top_categories: topCategories,
          recent_services: workerTypes,
          total_completed_jobs: jobsAgg.count || 0,
          knowledge_summary: `User has ${neuronsAgg.count || 0} neurons across categories: ${Object.entries(topCategories).slice(0, 5).map(([k, v]) => `${k}(${v})`).join(", ")}. Most used services: ${Object.entries(workerTypes).slice(0, 5).map(([k, v]) => `${k}(${v})`).join(", ")}.`,
          detected_intent: pendingRoute?.intent.category || "conversation",
          intent_confidence: pendingRoute?.intent.confidence || 0,
          suggested_services: pendingRoute?.intent.suggestedServices || [],
          input_type: pendingRoute?.input.type || "text",
          detected_urls: pendingRoute?.input.urls || [],
          user_tier: tier,
        },
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      if (resp.status === 429) { toast.error(t("errors:rate_limit_agent")); throw new Error("Rate limit exceeded"); }
      if (resp.status === 402) {
        toast.error(t("errors:credits_exhausted"), { action: { label: t("common:top_up"), onClick: () => navigate("/credits") } });
        throw new Error("AI credits exhausted");
      }
      throw new Error(errBody.error || `Error ${resp.status}`);
    }

    let fullContent = "";
    const assistantId = crypto.randomUUID();

    if (resp.body) {
      executionActions.setStreaming(true);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6).trim();
          if (d === "[DONE]") continue;
          try {
            const parsed = JSON.parse(d);
            if (parsed.agent_meta) {
              const meta = parsed.agent_meta;
              executionActions.setPlan({
                actionId: meta.action_id, intent: meta.intent, confidence: meta.confidence,
                planName: meta.plan_name, totalCredits: meta.total_credits,
                steps: meta.steps || [], objective: meta.objective, outputPreview: meta.output_preview,
              });
              setShowTaskTree(true);
              if (meta.total_credits === 0 || meta.intent === "general" || meta.intent === "help" || meta.intent === "check_status") {
                executionActions.confirmExecution();
              }
            }
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              if (execState.phase === "confirming") executionActions.confirmExecution();
              fullContent += c;
              executionActions.upsertAssistantMessage(assistantId, fullContent);
              if (fullContent.includes("Searching") || fullContent.includes("searching")) executionActions.updateStep("search_neurons", { status: "running" });
              if (fullContent.includes("Found") || fullContent.includes("results")) executionActions.updateStep("search_neurons", { status: "completed" });
            }
          } catch { /* partial JSON */ }
        }
      }

      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const d = raw.slice(6).trim();
          if (d === "[DONE]") continue;
          try {
            const parsed = JSON.parse(d);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              fullContent += c;
              executionActions.updateMessage(assistantId, fullContent);
            }
          } catch { /* ignore */ }
        }
      }
    }

    if (!fullContent) {
      fullContent = t("common:no_response");
      executionActions.addMessage({ id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() });
    }

    const parsedOutputs = parseOutputs(fullContent);
    if (parsedOutputs.length > 0) {
      executionActions.transition("delivering");
      executionActions.setOutputs(parsedOutputs);
      setShowOutputs(true);
    }

    executionActions.completeExecution();
    setShowPostExecution(true);
    saveMessage({ id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() });

    if (user) {
      const startTime = execState.startedAt ? new Date(execState.startedAt).getTime() : Date.now();
      logExecutionCompleted(user.id, execState.actionId, execState.intent, execState.totalCredits, parsedOutputs.length, Date.now() - startTime);
      persistRun({ execution: { ...execState, phase: "completed", completedAt: new Date().toISOString() }, outputCount: parsedOutputs.length });
    }
  };

  // ═══ Handlers ═══
  const handleStop = () => { abortRef.current?.abort(); executionActions.setLoading(false); executionActions.setStreaming(false); executionActions.failExecution("Cancelled by user"); };

  const clearChat = () => {
    newSession(); executionActions.reset();
    executionActions.clearMessages();
    executionActions.setOutputs([]); setShowOutputs(false); setShowTaskTree(false); setShowPostExecution(false);
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

  const handleCommand = (prompt: string) => {
    setInput(prompt);
    inputZoneRef.current?.focus();
  };

  // ═══ Derived state ═══
  const isEmptyState = messages.length === 0 && !loading;
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "Noapte bună" : hour < 12 ? "Bună dimineața" : hour < 18 ? "Bună ziua" : "Bună seara";
  const userName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const showRightPanel = execState.phase !== "idle";
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
        {/* ═══ LEFT: Chat History Sidebar ═══ */}
        <ChatHistorySidebar
          sessions={sessions}
          currentSessionId={sessionId}
          isOpen={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
          onNewSession={() => { clearChat(); setShowHistory(false); }}
          onLoadSession={async (sid) => {
            const loaded = await loadSession(sid);
            if (loaded.length > 0) executionActions.setMessages(loaded);
            setShowHistory(false);
          }}
          onDeleteSession={async (sid) => {
            await deleteSession(sid);
            toast.success("Sesiune ștearsă");
          }}
        />

        {/* ═══ CENTER: Main execution area ═══ */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Ambient background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.02] blur-[120px]" />
          </div>

          {/* ── Top bar ── */}
          <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-border/20 bg-background/60 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground/50 hover:text-foreground"
                onClick={() => setShowHistory(!showHistory)}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:inline">AI-IDEI</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Stats (hidden on mobile) */}
              <div className="hidden md:flex items-center gap-3 mr-3 text-[11px] text-muted-foreground/60">
                <span className="tabular-nums">{totalNeurons} neurons</span>
                <span className="opacity-30">·</span>
                <span className="tabular-nums">{totalEpisodes} episodes</span>
              </div>

              {/* Balance pill */}
              <button
                onClick={() => navigate("/credits")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full",
                  "border border-border/40 bg-card/60 backdrop-blur-md",
                  "hover:border-primary/30 hover:shadow-sm",
                  "transition-all duration-200"
                )}
              >
                <Coins className="h-3 w-3 text-primary" />
                <span className="text-xs font-bold tabular-nums text-foreground">{balance?.toLocaleString() ?? "—"}</span>
                <span className="text-[9px] font-medium text-muted-foreground/60 tracking-wider">N</span>
              </button>

              {/* Action buttons */}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground/40 hover:text-foreground" onClick={() => setShowMemory(!showMemory)} title="Memory">
                <History className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground/40 hover:text-foreground" onClick={clearChat} title="Sesiune nouă">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              {showRightPanel && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground/40 hover:text-foreground" onClick={() => setShowTaskTree(!showTaskTree)} title="Task Tree">
                  {showTaskTree ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>

          {/* ── Execution Status Bar ── */}
          <ExecutionStatusBar
            phase={execState.phase} intent={execState.intent}
            totalCredits={execState.totalCredits}
            stepsCompleted={execState.steps.filter(s => s.status === "completed").length}
            totalSteps={execState.steps.length}
            startedAt={execState.startedAt} errorMessage={execState.errorMessage}
          />

          {/* ── Permission gate ── */}
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

          {/* ── Plan Preview ── */}
          {execState.phase === "confirming" && execState.totalCredits > 0 && !showEconomicGate && (
            <div className="px-4 py-2 relative z-10">
              <PlanPreview
                plan={{
                  action_id: execState.actionId, intent: execState.intent,
                  confidence: execState.confidence, plan_name: execState.planName,
                  total_credits: execState.totalCredits,
                  steps: execState.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })),
                  objective: execState.objective, output_preview: execState.outputPreview,
                }}
                balance={balance}
                onExecute={() => {
                  if (execState.totalCredits > 50) { setShowEconomicGate(true); }
                  else {
                    if (user) logPlanConfirmed(user.id, execState.actionId, execState.intent, execState.totalCredits, execState.steps.length);
                    executionActions.confirmExecution();
                  }
                }}
                onEdit={() => { setInput(`Refine plan: ${execState.intent}`); inputZoneRef.current?.focus(); }}
                onDismiss={() => executionActions.reset()}
                executing={loading}
              />
            </div>
          )}

          {/* ── Economic Gate ── */}
          {showEconomicGate && execState.phase === "confirming" && (
            <div className="px-4 py-2 relative z-10">
              <EconomicGate
                balance={balance} estimatedCost={execState.totalCredits}
                tierDiscount={tierDiscount} tier={tier}
                onProceed={() => {
                  setShowEconomicGate(false);
                  if (user) {
                    logEconomicGate(user.id, true, balance, execState.totalCredits, tierDiscount);
                    logPlanConfirmed(user.id, execState.actionId, execState.intent, execState.totalCredits, execState.steps.length);
                  }
                  executionActions.confirmExecution();
                }}
                onCancel={() => { setShowEconomicGate(false); if (user) logEconomicGate(user.id, false, balance, execState.totalCredits, tierDiscount); executionActions.reset(); }}
              />
            </div>
          )}

          {/* ═══ MESSAGE STREAM / EMPTY STATE ═══ */}
          {isEmptyState ? (
            /* ── IDLE: Centered — fills available space, no scroll ── */
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 overflow-hidden px-4 sm:px-6">
              <div className="w-full max-w-3xl flex flex-col items-center gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full text-center space-y-3"
                >
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] leading-[1.15]">
                    {greeting},{" "}
                    <span className="bg-gradient-to-r from-primary via-primary/85 to-primary/70 bg-clip-text text-transparent">
                      {userName}
                    </span>
                  </h1>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Ce vrei să producem astăzi?
                  </p>
                </motion.div>

                {/* Proactive suggestions */}
                {decisionSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 gap-2 max-w-lg w-full"
                  >
                    {decisionSuggestions.slice(0, 4).map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => handleCommand(s.prompt)}
                        className="group flex items-start gap-2.5 p-2.5 rounded-xl border border-primary/15 bg-primary/[0.03] hover:bg-primary/[0.06] hover:border-primary/30 transition-all text-left"
                      >
                        <span className="text-base shrink-0 mt-0.5">{s.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{s.label}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Suggestion Tabs — compact */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="w-full max-w-2xl"
                >
                  <SuggestionTabs onCommand={handleCommand} />
                </motion.div>
              </div>
            </div>
          ) : (
            /* ── ACTIVE: Message stream — only this scrolls ── */
            <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10 min-h-0">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-4">
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

          {/* ── Output panel ── */}
          <AnimatePresence>
            {showOutputs && outputs.length > 0 && (
              <div className="px-4 pb-2 relative z-10">
                <OutputPanel outputs={outputs} visible={showOutputs} onRerun={handleRerun}
                  onClose={() => setShowOutputs(false)} onSaveAll={handleSaveAllOutputs} savingAll={savingAllOutputs} />
              </div>
            )}
          </AnimatePresence>

          {/* ── Pipeline Composer ── */}
          <AnimatePresence>
            {showPipeline && (
              <div className="px-4 pb-2 relative z-10">
                <PipelineComposer
                  balance={balance}
                  onExecute={(steps) => {
                    const pipelinePrompt = `/pipeline ${steps.map(s => s.label).join(" → ")}`;
                    setInput(pipelinePrompt);
                    setShowPipeline(false);
                    inputZoneRef.current?.focus();
                  }}
                  onSave={async (steps, name) => {
                    if (!user) return;
                    try {
                      const { error } = await supabase.from("agent_plan_templates").insert({
                        intent_key: "pipeline", name,
                        description: `Pipeline: ${steps.map(s => s.label).join(" → ")}`,
                        steps: steps.map(s => ({ tool: s.intent, label: s.label, credits: s.credits, config: s.config })) as any,
                        estimated_credits: steps.reduce((sum, s) => sum + s.credits, 0),
                        estimated_duration_seconds: steps.length * 10, is_default: false,
                      });
                      if (error) throw error;
                      toast.success(`Pipeline "${name}" saved`);
                      setShowPipeline(false);
                    } catch { toast.error("Failed to save pipeline"); }
                  }}
                  onClose={() => setShowPipeline(false)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* ── Post execution panel ── */}
          {execState.phase === "completed" && showPostExecution && (
            <div className="px-4 pb-2 relative z-10">
              <PostExecutionPanel
                intent={execState.intent as any} creditsSpent={execState.totalCredits}
                outputCount={outputs.length}
                onAction={(prompt) => { setInput(prompt); setShowPostExecution(false); inputZoneRef.current?.focus(); }}
                onSaveTemplate={handleSaveTemplate} onDismiss={() => setShowPostExecution(false)} userTier={tier}
              />
            </div>
          )}

          {/* ── Context Actions ── */}
          <ContextActions
            neuronCount={totalNeurons} episodeCount={totalEpisodes}
            lastIntent={execState.intent || undefined} phase={execState.phase}
            onAction={handleCommand}
            onOpenPipeline={() => setShowPipeline(true)}
          />

          {/* ── Input Zone ── */}
          <CommandInputZone
            ref={inputZoneRef} input={input} onInputChange={setInput}
            onSubmit={handleSubmit} onStop={handleStop} loading={loading}
            files={files} onFileSelect={(e) => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); }}
            onRemoveFile={(idx) => setFiles(prev => prev.filter((_, i) => i !== idx))}
            showSlashMenu={showSlashMenu} onShowSlashMenuChange={setShowSlashMenu}
            onSlashSelect={(cmd) => { setInput(cmd); inputZoneRef.current?.focus(); }}
          />
        </div>

        {/* ═══ RIGHT: Execution Panel ═══ */}
        <AnimatePresence>
          {showRightPanel && (
            <ExecutionRightPanel
              execution={execState}
              outputCount={outputs.length}
              balance={balance}
              onSaveTemplate={handleSaveTemplate}
              onViewOutputs={() => setShowOutputs(true)}
            />
          )}
        </AnimatePresence>

        {/* ═══ Side Panels (Task Tree + Memory) ═══ */}
        <SidePanels
          showTaskTree={showTaskTree} showMemory={showMemory}
          execution={execState}
          onCloseTaskTree={() => setShowTaskTree(false)} onCloseMemory={() => setShowMemory(false)}
          onSaveTemplate={handleSaveTemplate}
          onReplay={(intent) => { setInput(`/${intent} `); inputZoneRef.current?.focus(); setShowMemory(false); }}
          onExecuteTemplate={(template) => { setInput(`/${template.intent_key} (using template: ${template.name})`); setShowMemory(false); inputZoneRef.current?.focus(); }}
          sessions={sessions} onLoadSession={async (sid) => { const loaded = await loadSession(sid); if (loaded.length > 0) executionActions.setMessages(loaded); setShowMemory(false); }}
          onDeleteSession={async (sid) => { await deleteSession(sid); toast.success("Sesiune ștearsă"); }}
          currentSessionId={sessionId}
        />
      </div>
    </>
  );
}
