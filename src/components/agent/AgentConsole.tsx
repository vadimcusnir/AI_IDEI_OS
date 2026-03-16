import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useChatHistory, type ChatMessage } from "@/hooks/useChatHistory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Send, Loader2, Bot, User, Terminal, Upload,
  X, Paperclip, RotateCcw, History, ChevronLeft,
  Globe, Brain, Sparkles, FileText, Network, Zap,
  ArrowRight, FileUp, FileAudio, Film, Type, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AgentSlashMenu } from "./AgentSlashMenu";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-console`;

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content: "**Knowledge OS Agent** ready.\n\nI can orchestrate your entire knowledge pipeline. Paste a URL, drop a file, or tell me what you need.\n\n**Quick commands:**\n- `Analyze [URL]` — full pipeline extraction\n- `Extract neurons from [source]`\n- `Generate [article/framework/course]`\n- `Search [topic]` in your knowledge graph",
  timestamp: new Date(),
};

const COMMAND_HINTS = [
  { label: "Analyze YouTube video", icon: Globe, example: "Analyze this YouTube video: https://..." },
  { label: "Extract neurons", icon: Brain, example: "Extract neurons from my latest episode" },
  { label: "Generate article", icon: FileText, example: "Generate an article from neurons about leadership" },
  { label: "Search knowledge", icon: Network, example: "Show all neurons about persuasion techniques" },
];

export function AgentConsole() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();
  const {
    sessionId, sessions, isLoadingSessions,
    saveMessage, loadSession, loadCurrentSession,
    deleteSession, newSession, refreshSessions,
  } = useChatHistory();

  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [totalNeurons, setTotalNeurons] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  // Auto-load last session on mount
  useEffect(() => {
    if (!user || sessionLoaded) return;
    setSessionLoaded(true);
    loadCurrentSession().then((loaded) => {
      if (loaded.length > 0) {
        setMessages(loaded);
      }
    });
  }, [user, sessionLoaded, loadCurrentSession]);

  // Fetch user stats for context
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
      toast.error("Credite insuficiente pentru a rula comenzi AI. Reîncarcă NEURONS.", {
        action: { label: "Top-up", onClick: () => navigate("/credits") },
      });
      return;
    }

    const userContent = input.trim() + (files.length > 0 ? `\n\n[${files.length} file(s) attached: ${files.map(f => f.name).join(", ")}]` : "");

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
        if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
          fileContent += `\n--- ${file.name} ---\n` + await file.text();
        }
      }

      const apiMessages = messages
        .filter(m => m.role !== "system" && !m.id.startsWith("welcome"))
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

      apiMessages.push({ role: "user", content: userContent + fileContent });

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
          },
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast.error("Rate limit atins. Încearcă din nou în câteva secunde.");
          throw new Error("Rate limit exceeded");
        }
        if (resp.status === 402) {
          toast.error("Credite AI epuizate. Adaugă credite pentru a continua.", {
            action: { label: "Top-up", onClick: () => navigate("/credits") },
          });
          throw new Error("AI credits exhausted");
        }
        throw new Error(errBody.error || `Error ${resp.status}`);
      }

      // Stream response
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

        // Flush remaining
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
        fullContent = "Unable to generate a response. Please try again.";
        setMessages(prev => [
          ...prev,
          { id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() },
        ]);
      }

      saveMessage({ id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast.error("Agent error: " + (e instanceof Error ? e.message : "Unknown"));
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "An error occurred. Please try again.", timestamp: new Date() },
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
      { id: "welcome-reset", role: "assistant", content: "Session reset. What would you like to do?", timestamp: new Date() },
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
    toast.success("Session deleted");
  };

  const handleHintClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const isEmptyState = messages.length <= 1 && !loading;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold">Knowledge OS Agent</p>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span>{totalNeurons} neurons</span>
              <span>·</span>
              <span>{totalEpisodes} episodes</span>
              <span>·</span>
              <span className="text-primary font-medium">{balance.toLocaleString()} credits</span>
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
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Previous sessions {isLoadingSessions && <Loader2 className="inline h-2.5 w-2.5 animate-spin ml-1" />}
                </p>
                <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-3 w-3" />
                </button>
              </div>
              {sessions.length === 0 && (
                <p className="text-[10px] text-muted-foreground">No saved sessions</p>
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
                    <p className="text-[10px] truncate">{s.last_message || "Session"}</p>
                    <p className="text-[8px] text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()} · {s.message_count} msgs
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

        {/* Command hints — only in empty state */}
        {isEmptyState && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4"
          >
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
                <span className="text-[10px] text-muted-foreground">Processing…</span>
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

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card relative">
        <AgentSlashMenu
          input={input}
          visible={showSlashMenu}
          onSelect={(template) => {
            setInput(template);
            setShowSlashMenu(false);
            inputRef.current?.focus();
          }}
          onClose={() => setShowSlashMenu(false)}
        />
        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" className="hidden" multiple accept=".txt,.md,.csv,.json,.pdf,.mp3,.wav,.m4a,.mp4" onChange={handleFileSelect} />
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-4 w-4" />
          </Button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              const val = e.target.value;
              setInput(val);
              setShowSlashMenu(val === "/" || (val.startsWith("/") && !val.includes(" ")));
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type / for commands or tell me what you need..."
            rows={1}
            className="flex-1 bg-muted/50 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors resize-none min-h-[38px] max-h-[120px] placeholder:text-muted-foreground/50"
            style={{ height: "auto", overflow: "hidden" }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          {isStreaming ? (
            <Button size="sm" className="h-9 w-9 p-0 shrink-0 rounded-xl bg-destructive hover:bg-destructive/90" onClick={handleStop}>
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" className="h-9 w-9 p-0 shrink-0 rounded-xl" disabled={loading || (!input.trim() && files.length === 0)} onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground/50">
          <span className="flex items-center gap-1"><Zap className="h-2.5 w-2.5" /> Type <kbd className="px-1 py-0.5 bg-muted rounded text-[8px] font-mono">/</kbd> for commands</span>
          <span className="flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> URLs</span>
          <span className="flex items-center gap-1"><FileAudio className="h-2.5 w-2.5" /> Audio</span>
          <span className="ml-auto">⌘ + Enter to send</span>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble with markdown rendering ──
function AgentBubble({ msg, onNavigate, isStreaming }: { msg: Message; onNavigate: (path: string) => void; isStreaming?: boolean }) {
  const isUser = msg.role === "user";
  const actionLinks = extractActionLinks(msg.content);

  return (
    <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-primary/10" : "bg-primary/10"
      )}>
        {isUser ? <User className="h-3 w-3 text-primary" /> : <Terminal className="h-3 w-3 text-primary" />}
      </div>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3",
        isUser
          ? "bg-primary text-primary-foreground rounded-br-md"
          : "bg-muted text-foreground rounded-bl-md"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_code]:text-[10px] [&_code]:bg-background/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:text-[10px] [&_pre]:bg-background/50 [&_pre]:rounded-lg [&_strong]:text-foreground">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-primary/70 animate-pulse rounded-sm ml-0.5 -mb-0.5" />
            )}
          </div>
        )}

        {/* Quick action buttons */}
        {!isUser && !isStreaming && actionLinks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/50">
            {actionLinks.map((link, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className="h-6 text-[9px] gap-1 px-2"
                onClick={() => onNavigate(link.path)}
              >
                <link.icon className="h-2.5 w-2.5" />
                {link.label}
                <ArrowRight className="h-2 w-2" />
              </Button>
            ))}
          </div>
        )}

        <p className={cn(
          "text-[8px] mt-1.5",
          isUser ? "text-primary-foreground/50 text-right" : "text-muted-foreground/50"
        )}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ── Extract navigation action links from AI response ──
function extractActionLinks(content: string): Array<{ label: string; path: string; icon: React.ElementType }> {
  const links: Array<{ label: string; path: string; icon: React.ElementType }> = [];
  const lower = content.toLowerCase();

  if (lower.includes("neuron") && (lower.includes("view") || lower.includes("see") || lower.includes("browse"))) {
    links.push({ label: "View Neurons", path: "/neurons", icon: Brain });
  }
  if (lower.includes("extractor") || lower.includes("upload") || lower.includes("pipeline")) {
    links.push({ label: "Open Extractor", path: "/extractor", icon: Zap });
  }
  if (lower.includes("service") || lower.includes("generate") || lower.includes("produce")) {
    links.push({ label: "Services", path: "/services", icon: Sparkles });
  }
  if (lower.includes("knowledge graph") || lower.includes("intelligence")) {
    links.push({ label: "Intelligence", path: "/intelligence", icon: Network });
  }
  if (lower.includes("library") || lower.includes("artifact") || lower.includes("deliverable")) {
    links.push({ label: "Library", path: "/library", icon: FileText });
  }

  return links.slice(0, 3);
}
