import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useChatHistory, type ChatMessage } from "@/hooks/useChatHistory";
import { useCommandState } from "@/hooks/useCommandState";
import { useExecutionHistory } from "@/hooks/useExecutionHistory";
import { useRealtimeSteps } from "@/hooks/useRealtimeSteps";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { useAgentDecisionEngine } from "@/hooks/useAgentDecisionEngine";
import { type Message } from "./CommandBubble";
import { type OutputItem } from "./OutputPanel";
import { OutputPanel } from "./OutputPanel";
import { PlanPreview } from "./PlanPreview";
import { EconomicGate } from "./EconomicGate";
import { PermissionGate } from "./PermissionGate";
import { PostExecutionPanel } from "./PostExecutionPanel";
import { ContextActions } from "./ContextActions";
import { ExecutionStatusBar } from "./ExecutionStatusBar";
import { CommandHeader } from "./CommandHeader";
import { PipelineComposer, type PipelineStep } from "./PipelineComposer";
import { CommandInputZone, type CommandInputZoneRef } from "./CommandInputZone";
import { MessageStream } from "./MessageStream";
import { SidePanels } from "./SidePanels";
import { ChatHistorySidebar } from "./ChatHistorySidebar";
import { ExecutionRightPanel } from "./ExecutionRightPanel";
import { SuggestionTabs } from "./SuggestionTabs";
import { useUserTier } from "@/hooks/useUserTier";
import { routeCommand, type RouteResult } from "./CommandRouter";
import {
  logCommandSubmitted, logPlanConfirmed, logExecutionCompleted,
  logPermissionDenied, logEconomicGate,
} from "./AuditLogger";

const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-console`;

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content: `**Command Center** ready.\n\nIntroduce your command, upload a file, or paste a URL. The system will generate an execution plan before running.\n\n**Quick commands:** \`/analyze\`, \`/extract\`, \`/generate\`, \`/search\``,
  timestamp: new Date(),
};

interface CommandCenterProps {
  initialInput?: string;
}

export function CommandCenter({ initialInput }: CommandCenterProps = {}) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "errors"]);
  const {
    sessionId, sessions, isLoadingSessions,
    saveMessage, loadSession, loadCurrentSession,
    deleteSession, newSession, refreshSessions,
  } = useChatHistory();
  const cmdState = useCommandState();
  const { persistRun, persistOutputsBatch } = useExecutionHistory();
  const { tier } = useUserTier();
  const tierDiscount = tier === "pro" ? 25 : tier === "free" ? 0 : 10;
  const [showEconomicGate, setShowEconomicGate] = useState(false);
  const [permissionBlock, setPermissionBlock] = useState<RouteResult | null>(null);
  const [savingAllOutputs, setSavingAllOutputs] = useState(false);

  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState(initialInput ?? "");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showTaskTree, setShowTaskTree] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [showOutputs, setShowOutputs] = useState(false);
  const [showPostExecution, setShowPostExecution] = useState(false);
  const [totalNeurons, setTotalNeurons] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<RouteResult | null>(null);
  const [pendingInput, setPendingInput] = useState("");
  const [showPipeline, setShowPipeline] = useState(false);
  const { suggestions: decisionSuggestions } = useAgentDecisionEngine();
  const inputZoneRef = useRef<CommandInputZoneRef>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoSubmittedRef = useRef(false);

  // ═══ Realtime step tracking ═══
  useRealtimeSteps({
    actionId: cmdState.state.actionId,
    enabled: cmdState.state.phase === "executing" || cmdState.state.phase === "delivering",
    onStepUpdate: cmdState.updateStep,
    onAllCompleted: () => {
      if (cmdState.state.phase === "executing") cmdState.transition("delivering");
    },
  });

  // ═══ Global keyboard shortcuts ═══
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputZoneRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (loading) { abortRef.current?.abort(); setLoading(false); setIsStreaming(false); }
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
      if (loaded.length > 0) setMessages(loaded);
    });
  }, [user, sessionLoaded, loadCurrentSession]);

  // ═══ Auto-submit initialInput from Home page ═══
  useEffect(() => {
    if (initialInput && initialInput.trim() && user && !autoSubmittedRef.current && sessionLoaded) {
      autoSubmittedRef.current = true;
      // Small delay to let the component fully mount
      const timer = setTimeout(() => {
        inputZoneRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialInput, user, sessionLoaded]);

  // ═══ Fetch workspace stats ═══
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

  // ═══ Parse outputs from AI response ═══
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

  // ═══ SUBMIT → ROUTE → VALIDATE → EXECUTE ═══
  const handleSubmit = async () => {
    if (!input.trim() && files.length === 0) return;
    if (!user) return;

    const fileNames = files.map(f => f.name);
    const route = routeCommand(input.trim(), tier, balance, fileNames);

    if (!route.permitted) {
      setPermissionBlock(route);
      logPermissionDenied(user.id, route.intent.category, route.intent.requiredTier, tier);
      return;
    }

    logCommandSubmitted(user.id, route.intent.category, route.input.type, route.intent.estimatedCredits);

    if (balance < 20) {
      toast.error(t("errors:insufficient_credits_agent"), {
        action: { label: t("common:top_up"), onClick: () => navigate("/credits") },
      });
      return;
    }

    const userContent = input.trim() + (files.length > 0
      ? `\n\n[${t("common:files_attached", { count: files.length, names: files.map(f => f.name).join(", ") })}]`
      : "");

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: userContent, timestamp: new Date() };

    setMessages(prev => [...prev, userMessage]);
    setPendingInput(userContent);
    setInput("");
    setFiles([]);
    setShowOutputs(false);
    setShowPostExecution(false);
    setPermissionBlock(null);
    setPendingRoute(route);
    saveMessage(userMessage);
    cmdState.transition("planning");
    setLoading(true);

    try {
      await executeCommand(userContent, userMessage);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        cmdState.failExecution(e instanceof Error ? e.message : "Unknown error");
        toast.error(t("errors:agent_error", { message: e instanceof Error ? e.message : "Unknown" }));
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: t("common:error_retry"), timestamp: new Date() },
        ]);
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  // ═══ Core execution pipeline ═══
  const executeCommand = async (userContent: string, _userMessage: Message) => {
    if (!user) return;
    const controller = new AbortController();
    abortRef.current = controller;

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

    const apiMessages = messages
      .filter(m => m.role !== "system" && !m.id.startsWith("welcome"))
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
      setIsStreaming(true);
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
              cmdState.setPlan({
                actionId: meta.action_id, intent: meta.intent, confidence: meta.confidence,
                planName: meta.plan_name, totalCredits: meta.total_credits,
                steps: meta.steps || [], objective: meta.objective, outputPreview: meta.output_preview,
              });
              setShowTaskTree(true);
              if (meta.total_credits === 0 || meta.intent === "general" || meta.intent === "help" || meta.intent === "check_status") {
                cmdState.confirmExecution();
              }
            }
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              if (cmdState.state.phase === "confirming") cmdState.confirmExecution();
              fullContent += c;
              setMessages(prev => {
                const existing = prev.find(m => m.id === assistantId);
                if (existing) return prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m);
                return [...prev, { id: assistantId, role: "assistant" as const, content: fullContent, timestamp: new Date() }];
              });
              if (fullContent.includes("Searching") || fullContent.includes("searching")) cmdState.updateStep("search_neurons", { status: "running" });
              if (fullContent.includes("Found") || fullContent.includes("results")) cmdState.updateStep("search_neurons", { status: "completed" });
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
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m));
            }
          } catch { /* ignore */ }
        }
      }
    }

    if (!fullContent) {
      fullContent = t("common:no_response");
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() }]);
    }

    const parsedOutputs = parseOutputs(fullContent);
    if (parsedOutputs.length > 0) {
      cmdState.transition("delivering");
      setOutputs(parsedOutputs);
      setShowOutputs(true);
    }

    cmdState.completeExecution();
    setShowPostExecution(true);
    saveMessage({ id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() });

    if (user) {
      const startTime = cmdState.state.startedAt ? new Date(cmdState.state.startedAt).getTime() : Date.now();
      logExecutionCompleted(user.id, cmdState.state.actionId, cmdState.state.intent, cmdState.state.totalCredits, parsedOutputs.length, Date.now() - startTime);
      persistRun({ execution: { ...cmdState.state, phase: "completed", completedAt: new Date().toISOString() }, outputCount: parsedOutputs.length });
    }
  };

  // ═══ Handlers ═══
  const handleStop = () => { abortRef.current?.abort(); setLoading(false); setIsStreaming(false); cmdState.failExecution("Cancelled by user"); };

  const clearChat = () => {
    newSession(); cmdState.reset();
    setMessages([{ id: "welcome-reset", role: "assistant", content: "Session reset. Ready for new commands.", timestamp: new Date() }]);
    setOutputs([]); setShowOutputs(false); setShowTaskTree(false); setShowPostExecution(false);
  };

  const handleSaveAllOutputs = async () => {
    if (outputs.length === 0) return;
    setSavingAllOutputs(true);
    const count = await persistOutputsBatch(outputs.map(o => ({ title: o.title, content: o.content, type: o.type })), [cmdState.state.intent]);
    setSavingAllOutputs(false);
    toast[count > 0 ? "success" : "error"](count > 0 ? `Saved ${count} outputs as assets` : "Failed to save outputs");
  };

  const handleSaveTemplate = async () => {
    if (!user || cmdState.state.phase !== "completed") return;
    try {
      const { error } = await supabase.from("agent_plan_templates").insert({
        intent_key: cmdState.state.intent, name: `${cmdState.state.planName} (saved)`,
        description: cmdState.state.objective,
        steps: cmdState.state.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })) as any,
        estimated_credits: cmdState.state.totalCredits, estimated_duration_seconds: cmdState.state.steps.length * 5, is_default: false,
      });
      if (error) throw error;
      toast.success("Workflow saved as template");
    } catch { toast.error("Failed to save template"); }
  };

  const handleRerun = () => {
    const lastUser = messages.filter(m => m.role === "user").pop();
    if (lastUser) { setInput(lastUser.content); inputZoneRef.current?.focus(); }
  };

  const isEmptyState = messages.length <= 1 && !loading;

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Subtle background matching Home */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.02] blur-[100px]" />
      </div>
      <div className="flex flex-col h-full transition-all flex-1 min-w-0 relative z-10">
        <CommandHeader
          totalNeurons={totalNeurons}
          totalEpisodes={totalEpisodes}
          balance={balance}
          phase={cmdState.state.phase}
          showTaskTree={showTaskTree}
          onToggleMemory={() => setShowMemory(!showMemory)}
          onClearChat={clearChat}
          onToggleTaskTree={() => setShowTaskTree(!showTaskTree)}
        />

        <ExecutionStatusBar
          phase={cmdState.state.phase} intent={cmdState.state.intent}
          totalCredits={cmdState.state.totalCredits}
          stepsCompleted={cmdState.state.steps.filter(s => s.status === "completed").length}
          totalSteps={cmdState.state.steps.length}
          startedAt={cmdState.state.startedAt} errorMessage={cmdState.state.errorMessage}
        />

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

        {cmdState.state.phase === "confirming" && cmdState.state.totalCredits > 0 && !showEconomicGate && (
          <div className="px-4 py-2">
            <PlanPreview
              plan={{
                action_id: cmdState.state.actionId, intent: cmdState.state.intent,
                confidence: cmdState.state.confidence, plan_name: cmdState.state.planName,
                total_credits: cmdState.state.totalCredits,
                steps: cmdState.state.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })),
                objective: cmdState.state.objective, output_preview: cmdState.state.outputPreview,
              }}
              balance={balance}
              onExecute={() => {
                if (cmdState.state.totalCredits > 50) { setShowEconomicGate(true); }
                else {
                  if (user) logPlanConfirmed(user.id, cmdState.state.actionId, cmdState.state.intent, cmdState.state.totalCredits, cmdState.state.steps.length);
                  cmdState.confirmExecution();
                }
              }}
              onEdit={() => { setInput(`Refine plan: ${cmdState.state.intent}`); inputZoneRef.current?.focus(); }}
              onDismiss={() => cmdState.reset()}
              executing={loading}
            />
          </div>
        )}

        {showEconomicGate && cmdState.state.phase === "confirming" && (
          <div className="px-4 py-2">
            <EconomicGate
              balance={balance} estimatedCost={cmdState.state.totalCredits}
              tierDiscount={tierDiscount} tier={tier}
              onProceed={() => {
                setShowEconomicGate(false);
                if (user) {
                  logEconomicGate(user.id, true, balance, cmdState.state.totalCredits, tierDiscount);
                  logPlanConfirmed(user.id, cmdState.state.actionId, cmdState.state.intent, cmdState.state.totalCredits, cmdState.state.steps.length);
                }
                cmdState.confirmExecution();
              }}
              onCancel={() => { setShowEconomicGate(false); if (user) logEconomicGate(user.id, false, balance, cmdState.state.totalCredits, tierDiscount); cmdState.reset(); }}
            />
          </div>
        )}

        <MessageStream
          messages={messages} isStreaming={isStreaming} loading={loading}
          isEmptyState={isEmptyState} phase={cmdState.state.phase}
          execution={cmdState.state} outputs={outputs}
          suggestions={decisionSuggestions}
          totalNeurons={totalNeurons} totalEpisodes={totalEpisodes} balance={balance}
          onCommand={(ex) => { setInput(ex); inputZoneRef.current?.focus(); }}
          onSaveTemplate={handleSaveTemplate} onSaveAllOutputs={handleSaveAllOutputs}
          onRerun={handleRerun} onViewOutputs={() => setShowOutputs(true)}
        />

        <AnimatePresence>
          {showOutputs && outputs.length > 0 && (
            <div className="px-4 pb-2">
              <OutputPanel outputs={outputs} visible={showOutputs} onRerun={handleRerun}
                onClose={() => setShowOutputs(false)} onSaveAll={handleSaveAllOutputs} savingAll={savingAllOutputs} />
            </div>
          )}
        </AnimatePresence>

        {/* Pipeline Composer */}
        <AnimatePresence>
          {showPipeline && (
            <div className="px-4 pb-2">
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
                      intent_key: "pipeline",
                      name,
                      description: `Pipeline: ${steps.map(s => s.label).join(" → ")}`,
                      steps: steps.map(s => ({ tool: s.intent, label: s.label, credits: s.credits, config: s.config })) as any,
                      estimated_credits: steps.reduce((sum, s) => sum + s.credits, 0),
                      estimated_duration_seconds: steps.length * 10,
                      is_default: false,
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

        {cmdState.state.phase === "completed" && showPostExecution && (
          <div className="px-4 pb-2">
            <PostExecutionPanel
              intent={cmdState.state.intent as any} creditsSpent={cmdState.state.totalCredits}
              outputCount={outputs.length}
              onAction={(prompt) => { setInput(prompt); setShowPostExecution(false); inputZoneRef.current?.focus(); }}
              onSaveTemplate={handleSaveTemplate} onDismiss={() => setShowPostExecution(false)} userTier={tier}
            />
          </div>
        )}

        <ContextActions
          neuronCount={totalNeurons} episodeCount={totalEpisodes}
          lastIntent={cmdState.state.intent || undefined} phase={cmdState.state.phase}
          onAction={(prompt) => { setInput(prompt); inputZoneRef.current?.focus(); }}
          onOpenPipeline={() => setShowPipeline(true)}
        />

        <CommandInputZone
          ref={inputZoneRef} input={input} onInputChange={setInput}
          onSubmit={handleSubmit} onStop={handleStop} loading={loading}
          files={files} onFileSelect={(e) => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); }}
          onRemoveFile={(idx) => setFiles(prev => prev.filter((_, i) => i !== idx))}
          showSlashMenu={showSlashMenu} onShowSlashMenuChange={setShowSlashMenu}
          onSlashSelect={(cmd) => { setInput(cmd); inputZoneRef.current?.focus(); }}
        />
      </div>

      <SidePanels
        showTaskTree={showTaskTree} showMemory={showMemory}
        execution={cmdState.state}
        onCloseTaskTree={() => setShowTaskTree(false)} onCloseMemory={() => setShowMemory(false)}
        onSaveTemplate={handleSaveTemplate}
        onReplay={(intent) => { setInput(`/${intent} `); inputZoneRef.current?.focus(); setShowMemory(false); }}
        onExecuteTemplate={(template) => { setInput(`/${template.intent_key} (using template: ${template.name})`); setShowMemory(false); inputZoneRef.current?.focus(); }}
        sessions={sessions} onLoadSession={async (sid) => { const loaded = await loadSession(sid); if (loaded.length > 0) setMessages(loaded); setShowMemory(false); }}
        onDeleteSession={async (sid) => { await deleteSession(sid); toast.success(t("common:session_deleted")); }}
        currentSessionId={sessionId}
      />
    </div>
  );
}
