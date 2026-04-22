import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useChatHistory, type ChatMessage } from "@/hooks/useChatHistory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Send, Loader2, Bot, User, Terminal, Upload,
  X, Paperclip, RotateCcw, History, ChevronLeft,
  Globe, Brain, Sparkles, FileText, Network, Zap,
  ArrowRight, FileUp, FileAudio, Film, Type, Trash2,
  PanelRightOpen, PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AgentSlashMenu } from "./AgentSlashMenu";
import { AgentBubble } from "./AgentBubble";
import { ExecutionTimeline } from "./ExecutionTimeline";
import { COMMAND_PACKS, type CommandPack } from "./CommandPacks";
import { useAgentDecisionEngine, type Suggestion } from "@/hooks/useAgentDecisionEngine";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface PlanMeta {
  action_id: string | null;
  intent: string;
  confidence: number;
  plan_name: string;
  total_credits: number;
  steps: Array<{ tool: string; label: string; credits: number }>;
}

const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-console`;

export function AgentConsole() {
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

  const WELCOME_MSG: Message = {
    id: "welcome",
    role: "assistant",
    content: `**${t("common:knowledge_os_agent")}** ready.\n\nI can orchestrate your entire knowledge pipeline. Paste a URL, drop a file, or tell me what you need.\n\n**Quick commands:**\n- \`Analyze [URL]\` — full pipeline extraction\n- \`Extract neurons from [source]\`\n- \`Generate [article/framework/course]\`\n- \`Search [topic]\` in your knowledge graph`,
    timestamp: new Date(),
  };

  const COMMAND_HINTS = [
    { label: t("common:analyze_youtube"), icon: Globe, example: "Analyze this YouTube video: https://..." },
    { label: t("common:extract_neurons_hint"), icon: Brain, example: "Extract neurons from my latest episode" },
    { label: t("common:generate_article_hint"), icon: FileText, example: "Generate an article from neurons about leadership" },
    { label: t("common:search_knowledge_hint"), icon: Network, example: "Show all neurons about persuasion techniques" },
  ];

  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [planMeta, setPlanMeta] = useState<PlanMeta | null>(null);
  const [totalNeurons, setTotalNeurons] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [activePack, setActivePack] = useState<CommandPack | null>(null);
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
      if (loaded.length > 0) {
        setMessages(loaded);
      }
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

  const handleSend = async () => {
    if (!input.trim() && files.length === 0) return;
    if (!user) return;

    if (balance < 20) {
      toast.error(t("errors:insufficient_credits_agent"), {
        action: { label: t("common:top_up"), onClick: () => navigate("/credits") },
      });
      return;
    }

    const userContent = input.trim() + (files.length > 0 ? `\n\n[${t("common:files_attached", { count: files.length, names: files.map(f => f.name).join(", ") })}]` : "");

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setFiles([]);
    setLoading(true);
    setIsStreaming(false);
    saveMessage(userMessage);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let fileContent = "";
      for (const file of files) {
        if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".csv") || file.name.endsWith(".json")) {
          fileContent += `\n--- ${file.name} ---\n` + await file.text();
        } else if (file.type.startsWith("audio/") || file.type.startsWith("video/") || file.name.match(/\.(mp3|mp4|wav|m4a|webm|ogg)$/i)) {
          // Upload binary files to storage for processing
          const filePath = `chat-uploads/${user.id}/${Date.now()}_${file.name}`;
          const { error: uploadErr } = await supabase.storage.from("user-uploads").upload(filePath, file);
          if (uploadErr) {
            fileContent += `\n[Upload failed: ${file.name} — ${uploadErr.message}]`;
          } else {
            const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(filePath);
            fileContent += `\n[Uploaded: ${file.name} → ${urlData.publicUrl}]`;
          }
        } else if (file.name.match(/\.(pdf|docx|doc)$/i)) {
          fileContent += `\n[Document attached: ${file.name} (${(file.size / 1024).toFixed(0)} KB) — will be processed by pipeline]`;
        } else {
          fileContent += `\n[File attached: ${file.name} (${file.type || 'unknown'}, ${(file.size / 1024).toFixed(0)} KB)]`;
        }
      }

      // Build conversation with memory layers
      // Layer 1: Session memory (last 20 messages from current session)
      const apiMessages = messages
        .filter(m => m.role !== "system" && !m.id.startsWith("welcome"))
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

      apiMessages.push({ role: "user", content: userContent + fileContent });

      // Layer 2: User memory (aggregate stats from DB)
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
            // Layer 2: User memory
            top_categories: topCategories,
            recent_services: workerTypes,
            total_completed_jobs: jobsAgg.count || 0,
            // Layer 3: Knowledge memory (entity counts)
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
              // Detect agent metadata (plan info)
              if (parsed.agent_meta) {
                setPlanMeta(parsed.agent_meta);
                setShowTimeline(true);
              }
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) {
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

      saveMessage({ id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast.error(t("errors:agent_error", { message: e instanceof Error ? e.message : "Unknown" }));
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: t("common:error_retry"), timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const clearChat = () => {
    newSession();
    setMessages([
      { id: "welcome-reset", role: "assistant", content: t("common:session_reset"), timestamp: new Date() },
    ]);
  };

  const handleLoadSession = async (sid: string) => {
    const loaded = await loadSession(sid);
    if (loaded.length > 0) setMessages(loaded);
    setShowHistory(false);
  };

  const handleDeleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSession(sid);
    toast.success(t("common:session_deleted"));
  };

  const handleHintClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const isEmptyState = messages.length <= 1 && !loading;

  return (
    <div className="flex h-full">
      {/* Main chat column */}
      <div className={cn("flex flex-col h-full transition-all", showTimeline ? "flex-1 min-w-0" : "w-full")}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold">{t("common:knowledge_os_agent")}</p>
            <div className="flex items-center gap-2 text-nano text-muted-foreground">
              <span>{totalNeurons} {t("common:neurons_label")}</span>
              <span>·</span>
              <span>{totalEpisodes} {t("common:episodes_label")}</span>
              <span>·</span>
              <span className="text-primary font-medium">{balance.toLocaleString()} {t("common:credits_label")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowHistory(!showHistory)}>
            <History className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={clearChat}>
            <RotateCcw className="h-3 w-3" />
          </Button>
          {planMeta && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowTimeline(!showTimeline)}>
              {showTimeline ? <PanelRightClose className="h-3 w-3" /> : <PanelRightOpen className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {/* Session history */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="bg-muted/30 px-4 py-3 max-h-48 overflow-y-auto space-y-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common:previous_sessions")} {isLoadingSessions && <Loader2 className="inline h-2.5 w-2.5 animate-spin ml-1" />}
                </p>
                <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-3 w-3" />
                </button>
              </div>
              {sessions.length === 0 && (
                <p className="text-micro text-muted-foreground">{t("common:no_saved_sessions")}</p>
              )}
              {sessions.map(s => (
                <button
                  key={s.session_id}
                  onClick={() => handleLoadSession(s.session_id)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors group flex items-center justify-between",
                    s.session_id === sessionId && "bg-primary/5 border border-primary/20"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-micro truncate">{s.last_message || "Session"}</p>
                    <p className="text-nano text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()} · {s.message_count === 1 ? "1 message" : `${s.message_count} messages`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(s.session_id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity ml-2 shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <AgentBubble key={msg.id} msg={msg} onNavigate={navigate} isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"} />
        ))}

        {/* Proactive Suggestions from Decision Engine */}
        {isEmptyState && decisionSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2 mt-2"
          >
            <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground px-1">
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
                    <p className="text-micro text-muted-foreground line-clamp-2">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Command Pack selector + hints — only in empty state */}
        {isEmptyState && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 mt-4"
          >
            {/* Command Pack Selector */}
            <div className="space-y-2">
              <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Choose your role
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

            {/* Active pack quick prompts */}
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
                      <p className="text-micro text-muted-foreground line-clamp-2">{qp.prompt}</p>
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
                      <p className="text-micro text-muted-foreground truncate max-w-[180px]">{hint.example}</p>
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
              <Terminal className="h-3 w-3 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-micro text-muted-foreground">{t("common:processing")}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File attachments preview */}
      {files.length > 0 && (
        <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-border">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-micro">
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[120px]">{f.name}</span>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3">
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
              placeholder={t("common:type_message")}
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
              onClick={handleSend}
              disabled={!input.trim() && files.length === 0}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      </div>

      {/* Execution Timeline panel */}
      <AnimatePresence>
        {showTimeline && planMeta && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border bg-card overflow-hidden shrink-0"
          >
            <ExecutionTimeline planMeta={planMeta} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// AgentBubble extracted to ./AgentBubble.tsx