import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useChatHistory } from "@/hooks/useChatHistory";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Send, Loader2, Bot, User, Sparkles, Upload,
  X, Paperclip, RotateCcw, History, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const SYSTEM_PROMPT = `You are the AI-IDEI platform assistant. You help users:
- Extract knowledge from transcripts and content
- Run AI services (summary, personality intelligence, avatar33, podcast intelligence, etc.)
- Navigate the platform (neurons, services, jobs, library, credits)
- Understand their knowledge graph and IdeaRank scores

When a user wants to run a service, respond with actionable guidance.
When they ask about their data, help them find it.
Be concise, professional, and use Romanian when the user writes in Romanian.`;

export function PlatformChat({ neuronContext }: { neuronContext?: { title: string; blocks: Array<{ type: string; content: string }> } }) {
  const { user } = useAuth();
  const { t } = useTranslation("common");
  const { saveMessage, sessions, loadSession, newSession } = useChatHistory();
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: t("chat_welcome"),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isStreamingRef = useRef(false);
  const userScrolledUpRef = useRef(false);

  const scrollToBottom = useCallback((smooth = false) => {
    if (userScrolledUpRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  }, []);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      userScrolledUpRef.current = distance > 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Smooth scroll on new message — not on every streaming token
  useEffect(() => {
    if (!isStreamingRef.current) scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() && files.length === 0) return;
    if (!user) return;

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
    isStreamingRef.current = true;
    userScrolledUpRef.current = false;

    saveMessage(userMessage);

    try {
      // Read file content if text-based
      let fileContent = "";
      for (const file of files) {
        if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
          fileContent += `\n--- ${file.name} ---\n` + await file.text();
        }
      }

      // Build messages array for the API (correct format)
      const apiMessages = messages
        .filter(m => m.role !== "system" && m.id !== "welcome" && !m.id.startsWith("welcome-"))
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));
      
      // Add the current user message with any file content
      apiMessages.push({ role: "user", content: userContent + fileContent });

      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuron-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            neuron_context: neuronContext || null,
          }),
        }
      );

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.error || `Error ${resp.status}`);
      }

      // Stream response
      let fullContent = "";
      const assistantId = crypto.randomUUID();

      if (resp.body) {
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
                // Discrete auto-scroll during streaming (no smooth → no jitter)
                scrollToBottom(false);
              }
            } catch { /* partial */ }
          }
        }
      }

      if (!fullContent) {
        fullContent = t("chat_no_response");
        setMessages(prev => [
          ...prev,
          { id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() },
        ]);
      }

      // Persist assistant message
      saveMessage({ id: assistantId, role: "assistant", content: fullContent, timestamp: new Date() });

    } catch (e) {
      toast.error(t("chat_error", { message: e instanceof Error ? e.message : "Unknown" }));
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: t("chat_error_fallback"), timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      isStreamingRef.current = false;
      scrollToBottom(true);
    }
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
      { id: "welcome-reset", role: "assistant", content: t("chat_reset"), timestamp: new Date() },
    ]);
  };

  const handleLoadSession = async (sid: string) => {
    const loaded = await loadSession(sid);
    if (loaded.length > 0) {
      setMessages(loaded);
    }
    setShowHistory(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">AI-IDEI Assistant</p>
            <p className="text-nano text-muted-foreground">Knowledge OS • Always online</p>
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

      {/* Session history drawer */}
      {showHistory && (
        <div className="border-b border-border bg-muted/30 px-4 py-3 max-h-48 overflow-y-auto space-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{t("previous_conversations")}</p>
            <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-3 w-3" />
            </button>
          </div>
          {sessions.length === 0 && (
            <p className="text-micro text-muted-foreground">{t("no_saved_conversations")}</p>
          )}
          {sessions.map(s => (
            <button
              key={s.session_id}
              onClick={() => handleLoadSession(s.session_id)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <p className="text-micro truncate">{s.last_message || t("conversation")}</p>
              <p className="text-nano text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Bot className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
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
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" className="hidden" multiple accept=".txt,.md,.csv,.json,.pdf" onChange={handleFileSelect} />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
          </Button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("type_message")}
            rows={1}
            className="flex-1 bg-muted/50 rounded-xl px-3.5 py-2 text-sm outline-none border border-border focus:border-primary transition-colors resize-none min-h-[36px] max-h-[120px]"
            style={{ height: "auto", overflow: "hidden" }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <Button size="sm" className="h-8 w-8 p-0 shrink-0" disabled={loading || (!input.trim() && files.length === 0)} onClick={handleSend}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  return (
    <div className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        msg.role === "user" ? "bg-primary/10" : "bg-muted"
      )}>
        {msg.role === "user" ? <User className="h-3 w-3 text-primary" /> : <Bot className="h-3 w-3 text-muted-foreground" />}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
        msg.role === "user"
          ? "bg-primary text-primary-foreground rounded-br-md"
          : "bg-muted text-foreground rounded-bl-md"
      )}>
        <div className="text-xs leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1 prose-headings:my-1 break-words">
          {msg.role === "user" ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          )}
        </div>
        <p className={cn(
          "text-nano mt-1",
          msg.role === "user" ? "text-primary-foreground/50 text-right" : "text-muted-foreground/50"
        )}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
