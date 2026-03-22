import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, RotateCcw, Trash2, Download, Plus, MessageSquare, Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notebook, NotebookSource } from "@/hooks/useNotebook";
import type { UseMutationResult } from "@tanstack/react-query";
import { useNotebookChat } from "@/hooks/useNotebookChat";
import { useNotebookSessions } from "@/hooks/useNotebookSessions";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  notebook: Notebook | undefined;
  sources: NotebookSource[];
  messages: any[];
  sendMessage: UseMutationResult<void, Error, string>;
  updateTitle: UseMutationResult<void, Error, string>;
}

const SUGGESTED_PROMPTS = [
  "Summarize all sources",
  "Extract key frameworks",
  "Find contradictions",
  "Generate action items",
];

export function NotebookChatPanel({ notebook, sources, messages: dbMessages, updateTitle }: Props) {
  const [input, setInput] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    sessions, activeSessionId, setActiveSessionId,
    ensureSession, createSession, renameSession, deleteSession,
  } = useNotebookSessions(notebook?.id);

  const { messages, isStreaming, sendMessage: send, clearMessages, setMessages } = useNotebookChat({
    notebookId: notebook?.id,
    sessionId: activeSessionId,
    sources,
  });

  // Auto-create session on mount
  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  // Load DB messages for active session
  useEffect(() => {
    if (!activeSessionId) return;
    const sessionMessages = dbMessages.filter((m: any) =>
      m.session_id === activeSessionId || (!m.session_id && !activeSessionId)
    );
    if (sessionMessages.length > 0) {
      setMessages(sessionMessages.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })));
    } else {
      clearMessages();
    }
  }, [activeSessionId, dbMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    await ensureSession();
    send(text);
    setInput("");
  };

  const handleClearChat = async () => {
    clearMessages();
    if (notebook?.id && activeSessionId) {
      await supabase.from("notebook_messages").delete().eq("session_id", activeSessionId);
      toast.success("Chat cleared");
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const text = messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${notebook?.title || "notebook"}-chat.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported");
  };

  const handleNewSession = () => {
    createSession.mutate(undefined);
    clearMessages();
  };

  const handleSwitchSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowSessions(false);
  };

  const selectedCount = sources.filter((s) => s.is_selected).length;
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <input
          value={notebook?.title || ""}
          onChange={(e) => updateTitle.mutate(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none outline-none text-foreground w-full placeholder:text-muted-foreground/30"
          placeholder="Untitled Notebook"
        />
        <div className="flex items-center gap-2 mt-1.5">
          {/* Session selector */}
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/30 rounded-md px-2 py-1"
          >
            <MessageSquare className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{activeSession?.title || "Chat"}</span>
          </button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleNewSession}>
            <Plus className="h-3 w-3" />
          </Button>
          <span className="text-[10px] text-muted-foreground">{selectedCount}/{sources.length} sources</span>
          {messages.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={handleExportChat} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                <Download className="h-2.5 w-2.5" /> Export
              </button>
              <button onClick={handleClearChat} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                <Trash2 className="h-2.5 w-2.5" /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sessions dropdown */}
      <AnimatePresence>
        {showSessions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-card"
          >
            <div className="px-4 py-2 space-y-0.5 max-h-48 overflow-y-auto">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors group",
                    s.id === activeSessionId ? "bg-primary/10 text-foreground" : "hover:bg-accent/5 text-muted-foreground"
                  )}
                >
                  {editingSessionId === s.id ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => {
                        if (editTitle.trim()) renameSession.mutate({ id: s.id, title: editTitle.trim() });
                        setEditingSessionId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editTitle.trim()) renameSession.mutate({ id: s.id, title: editTitle.trim() });
                          setEditingSessionId(null);
                        }
                      }}
                      className="flex-1 bg-transparent border-b border-primary outline-none text-xs"
                      autoFocus
                    />
                  ) : (
                    <>
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      <span className="flex-1 truncate" onClick={() => handleSwitchSession(s.id)}>{s.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingSessionId(s.id); setEditTitle(s.title); }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                      {sessions.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSession.mutate(s.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Sparkles className="h-10 w-10 text-primary/30 mb-4" />
            </motion.div>
            <h3 className="text-lg font-medium text-foreground mb-2">Start a conversation</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Ask questions about your sources, extract insights, or generate content.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <motion.button
                  key={prompt}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="px-4 py-2 text-xs rounded-full border border-border bg-card hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-primary/10 text-foreground ml-8"
                      : "bg-muted/30 text-foreground mr-8"
                  )}
                >
                  <div className="text-[10px] font-mono text-muted-foreground mb-1 uppercase">
                    {msg.role}
                  </div>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground text-xs ml-2"
              >
                <RotateCcw className="h-3 w-3 animate-spin" /> Thinking...
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-6 py-3 border-t border-border shrink-0">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={selectedCount > 0 ? "Ask about your sources..." : "Select sources first, then ask..."}
            rows={1}
            className="flex-1 resize-none bg-card border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 min-h-[44px] max-h-32"
          />
          <Button
            size="icon"
            className="h-11 w-11 rounded-full shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            {isStreaming ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
