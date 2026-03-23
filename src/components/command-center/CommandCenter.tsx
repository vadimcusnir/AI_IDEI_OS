import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useChatHistory, type ChatMessage } from "@/hooks/useChatHistory";
import { useCommandState, type TaskStep } from "@/hooks/useCommandState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send, Loader2, User, Upload,
  X, Paperclip, RotateCcw, History,
  Globe, Brain, Sparkles, FileText, Network, Zap,
  Coins, Command, Play, Shield,
  PanelRightOpen, PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AgentSlashMenu } from "@/components/agent/AgentSlashMenu";
import { COMMAND_PACKS, type CommandPack } from "@/components/agent/CommandPacks";
import { useAgentDecisionEngine } from "@/hooks/useAgentDecisionEngine";
import { PlanPreview, type ExecutionPlan } from "./PlanPreview";
import { OutputPanel, type OutputItem } from "./OutputPanel";
import { MemoryPanel } from "./MemoryPanel";
import { TaskTree } from "./TaskTree";
import { EconomicGate, KernelBadge } from "./EconomicGate";
import { useUserTier } from "@/hooks/useUserTier";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-console`;

export function CommandCenter() {
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
  const { tier } = useUserTier();
  const tierDiscount = tier === "vip" ? 40 : tier === "elite" ? 40 : tier === "pro" ? 25 : tier === "core" ? 10 : 0;
  const [showEconomicGate, setShowEconomicGate] = useState(false);

  const WELCOME_MSG: Message = {
    id: "welcome",
    role: "assistant",
    content: `**Command Center** ready.\n\nIntroduce your command, upload a file, or paste a URL. The system will generate an execution plan before running.\n\n**Quick commands:** \`/analyze\`, \`/extract\`, \`/generate\`, \`/search\``,
    timestamp: new Date(),
  };

  const COMMAND_HINTS = [
    { label: "Analyze source", icon: Globe, example: "Analyze this YouTube video: https://..." },
    { label: "Extract neurons", icon: Brain, example: "Extract neurons from my latest episode" },
    { label: "Generate asset", icon: Sparkles, example: "Generate an article from neurons about leadership" },
    { label: "Search knowledge", icon: Network, example: "Show all neurons about persuasion techniques" },
  ];

  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showTaskTree, setShowTaskTree] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [showOutputs, setShowOutputs] = useState(false);
  const [totalNeurons, setTotalNeurons] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [activePack, setActivePack] = useState<CommandPack | null>(null);
  const [pendingInput, setPendingInput] = useState("");
  const { suggestions: decisionSuggestions } = useAgentDecisionEngine();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  useEffect(() => {
    if (!user || sessionLoaded) return;
    setSessionLoaded(true);
    loadCurrentSession().then((loaded) => {
      if (loaded.length > 0) setMessages(loaded);
    });
  }, [user, sessionLoaded, loadCurrentSession]);

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

  // ═══ PHASE 1: Submit command → get plan ═══
  const handleSubmit = async () => {
    if (!input.trim() && files.length === 0) return;
    if (!user) return;

    if (balance < 20) {
      toast.error(t("errors:insufficient_credits_agent"), {
        action: { label: t("common:top_up"), onClick: () => navigate("/credits") },
      });
      return;
    }

    const userContent = input.trim() + (files.length > 0
      ? `\n\n[${t("common:files_attached", { count: files.length, names: files.map(f => f.name).join(", ") })}]`
      : "");

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setPendingInput(userContent);
    setInput("");
    setFiles([]);
    setShowOutputs(false);
    saveMessage(userMessage);

    // Transition to planning
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
        },
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        toast.error(t("errors:rate_limit_agent"));
        throw new Error("Rate limit exceeded");
      }
      if (resp.status === 402) {
        toast.error(t("errors:credits_exhausted"), {
          action: { label: t("common:top_up"), onClick: () => navigate("/credits") },
        });
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

            // ═══ Capture plan metadata → transition to confirming ═══
            if (parsed.agent_meta) {
              const meta = parsed.agent_meta;
              cmdState.setPlan({
                actionId: meta.action_id,
                intent: meta.intent,
                confidence: meta.confidence,
                planName: meta.plan_name,
                totalCredits: meta.total_credits,
                steps: meta.steps || [],
                objective: meta.objective,
                outputPreview: meta.output_preview,
              });
              setShowTaskTree(true);

              // Auto-confirm for low-cost plans (< 100N) or conversations
              if (meta.total_credits === 0 || meta.intent === "general" || meta.intent === "help" || meta.intent === "check_status") {
                cmdState.confirmExecution();
              }
            }

            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              // If we have content streaming, we're in executing phase
              if (cmdState.state.phase === "confirming") {
                cmdState.confirmExecution();
              }

              fullContent += c;
              setMessages(prev => {
                const existing = prev.find(m => m.id === assistantId);
                if (existing) {
                  return prev.map(m =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  );
                }
                return [
                  ...prev,
                  { id: assistantId, role: "assistant" as const, content: fullContent, timestamp: new Date() },
                ];
              });

              // Update step statuses based on content patterns
              if (fullContent.includes("Searching") || fullContent.includes("searching")) {
                cmdState.updateStep("search_neurons", { status: "running" });
              }
              if (fullContent.includes("Found") || fullContent.includes("results")) {
                cmdState.updateStep("search_neurons", { status: "completed" });
              }
            }
          } catch { /* partial JSON */ }
        }
      }

      // Flush remaining buffer
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
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: fullContent } : m
              ));
            }
          } catch { /* ignore */ }
        }
      }
    }

    if (!fullContent) {
      fullContent = t("common:no_response");
      setMessages(prev => [
        ...prev,
        { id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() },
      ]);
    }

    // ═══ Transition to delivering → completed ═══
    const parsedOutputs = parseOutputs(fullContent);
    if (parsedOutputs.length > 0) {
      cmdState.transition("delivering");
      setOutputs(parsedOutputs);
      setShowOutputs(true);
    }

    cmdState.completeExecution();
    saveMessage({ id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() });
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
    setIsStreaming(false);
    cmdState.failExecution("Cancelled by user");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const clearChat = () => {
    newSession();
    cmdState.reset();
    setMessages([{ id: "welcome-reset", role: "assistant", content: "Session reset. Ready for new commands.", timestamp: new Date() }]);
    setOutputs([]);
    setShowOutputs(false);
    setShowTaskTree(false);
  };

  const handleLoadSession = async (sid: string) => {
    const loaded = await loadSession(sid);
    if (loaded.length > 0) setMessages(loaded);
    setShowMemory(false);
  };

  const handleDeleteSession = async (sid: string) => {
    await deleteSession(sid);
    toast.success(t("common:session_deleted"));
  };

  const handleHintClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const handleReplay = (intent: string) => {
    setInput(`/${intent} `);
    inputRef.current?.focus();
    setShowMemory(false);
  };

  const handleSaveTemplate = async () => {
    if (!user || cmdState.state.phase !== "completed") return;
    try {
      const { error } = await supabase.from("agent_plan_templates").insert({
        intent_key: cmdState.state.intent,
        name: `${cmdState.state.planName} (saved)`,
        description: cmdState.state.objective,
        steps: cmdState.state.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })) as any,
        estimated_credits: cmdState.state.totalCredits,
        estimated_duration_seconds: cmdState.state.steps.length * 5,
        is_default: false,
      });
      if (error) throw error;
      toast.success("Workflow saved as template");
    } catch {
      toast.error("Failed to save template");
    }
  };

  const isEmptyState = messages.length <= 1 && !loading;
  const showRightPanel = showTaskTree && cmdState.state.phase !== "idle";

  return (
    <div className="flex h-full">
      {/* ═══ MAIN COLUMN ═══ */}
      <div className="flex flex-col h-full transition-all flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Command className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-tight">Command Center</p>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span>{totalNeurons} neurons</span>
                <span>·</span>
                <span>{totalEpisodes} episodes</span>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-primary font-medium">
                  <Coins className="h-2.5 w-2.5" />
                  {balance.toLocaleString()} N
                </span>
                {cmdState.state.phase !== "idle" && (
                  <>
                    <span>·</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[8px] h-4",
                        cmdState.state.phase === "executing" && "border-primary text-primary",
                        cmdState.state.phase === "completed" && "border-green-500 text-green-500",
                        cmdState.state.phase === "failed" && "border-destructive text-destructive",
                      )}
                    >
                      {cmdState.state.phase === "executing" && <Loader2 className="h-2 w-2 mr-0.5 animate-spin" />}
                      {cmdState.state.phase.toUpperCase()}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowMemory(!showMemory)} title="Memory & History">
              <History className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={clearChat} title="New session">
              <RotateCcw className="h-3 w-3" />
            </Button>
            {cmdState.state.phase !== "idle" && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowTaskTree(!showTaskTree)} title="Task Tree">
                {showTaskTree ? <PanelRightClose className="h-3 w-3" /> : <PanelRightOpen className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </div>

        {/* ═══ ZONE 2: Plan Preview (confirmation gate) ═══ */}
        {cmdState.state.phase === "confirming" && cmdState.state.totalCredits > 0 && (
          <div className="px-4 py-2">
            <PlanPreview
              plan={{
                action_id: cmdState.state.actionId,
                intent: cmdState.state.intent,
                confidence: cmdState.state.confidence,
                plan_name: cmdState.state.planName,
                total_credits: cmdState.state.totalCredits,
                steps: cmdState.state.steps.map(s => ({ tool: s.tool, label: s.label, credits: s.credits })),
                objective: cmdState.state.objective,
                output_preview: cmdState.state.outputPreview,
              }}
              balance={balance}
              onExecute={() => cmdState.confirmExecution()}
              onEdit={() => {
                setInput(`Refine plan: ${cmdState.state.intent}`);
                inputRef.current?.focus();
              }}
              onDismiss={() => cmdState.reset()}
              executing={loading}
            />
          </div>
        )}

        {/* ═══ ZONE 3: Messages / Execution area ═══ */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <CommandBubble
              key={msg.id}
              msg={msg}
              onNavigate={navigate}
              isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
            />
          ))}

          {/* Proactive Suggestions */}
          {isEmptyState && decisionSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-2 mt-2"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Suggested next actions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {decisionSuggestions.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleHintClick(s.prompt)}
                    className="group flex items-start gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm">{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{s.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Command Packs — only empty state */}
          {isEmptyState && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Command Packs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMAND_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => setActivePack(activePack?.id === pack.id ? null : pack)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
                        activePack?.id === pack.id
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-card hover:border-primary/30 text-muted-foreground"
                      )}
                    >
                      <span>{pack.emoji}</span>
                      <span>{pack.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {activePack ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activePack.quickPrompts.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => handleHintClick(qp.prompt)}
                      className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <span className="text-sm">{activePack.emoji}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium">{qp.label}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{qp.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMAND_HINTS.map((hint) => (
                    <button
                      key={hint.label}
                      onClick={() => handleHintClick(hint.example)}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <hint.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{hint.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{hint.example}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {loading && !isStreaming && (
            <div className="flex gap-2.5">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Command className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-[10px] text-muted-foreground">
                    {cmdState.state.phase === "planning" ? "Generating execution plan..." : "Processing..."}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ═══ ZONE 4: Output Panel ═══ */}
        <AnimatePresence>
          {showOutputs && outputs.length > 0 && (
            <div className="px-4 pb-2">
              <OutputPanel
                outputs={outputs}
                visible={showOutputs}
                onRerun={() => {
                  const lastUser = messages.filter(m => m.role === "user").pop();
                  if (lastUser) { setInput(lastUser.content); inputRef.current?.focus(); }
                }}
                onClose={() => setShowOutputs(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* File preview */}
        {files.length > 0 && (
          <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-border">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-[10px]">
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="truncate max-w-[120px]">{f.name}</span>
                <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ═══ ZONE 1: Command Input ═══ */}
        <div className="border-t border-border p-3 bg-card">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json,.pdf,.docx,.mp3,.mp4,.wav,.m4a,.webm,.ogg,.srt,text/*,audio/*,video/*,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSlashMenu(e.target.value.startsWith("/") && !e.target.value.includes(" "));
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command, paste a URL, or describe what you need..."
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[36px] max-h-[120px]"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 120) + "px";
                }}
              />
              {showSlashMenu && (
                <AgentSlashMenu
                  input={input}
                  visible={showSlashMenu}
                  onSelect={(cmd) => {
                    setInput(cmd + " ");
                    setShowSlashMenu(false);
                    inputRef.current?.focus();
                  }}
                  onClose={() => setShowSlashMenu(false)}
                />
              )}
            </div>
            {loading ? (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={handleStop}>
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={handleSubmit}
                disabled={!input.trim() && files.length === 0}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: Task Tree Panel ═══ */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border bg-card overflow-hidden shrink-0"
          >
            <TaskTree
              execution={cmdState.state}
              onSaveTemplate={handleSaveTemplate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ RIGHT: Memory Panel ═══ */}
      <AnimatePresence>
        {showMemory && (
          <MemoryPanel
            visible={showMemory}
            onClose={() => setShowMemory(false)}
            onReplay={handleReplay}
            sessions={sessions}
            onLoadSession={handleLoadSession}
            onDeleteSession={handleDeleteSession}
            currentSessionId={sessionId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Bubble component ─── */
function CommandBubble({
  msg,
  onNavigate,
  isStreaming,
}: {
  msg: Message;
  onNavigate: (path: string) => void;
  isStreaming?: boolean;
}) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Command className="h-3 w-3 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[85%] text-xs leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_li]:text-xs [&_code]:text-[10px] [&_code]:bg-background/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3 bg-primary/60 animate-pulse ml-0.5 rounded-sm" />
        )}
      </div>
      {isUser && (
        <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}
