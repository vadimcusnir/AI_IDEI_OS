import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Loader2, Sparkles, Trash2, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Block } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface NeuronChatPanelProps {
  blocks: Block[];
  neuronTitle: string;
  isVisible: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuron-chat`;

export function NeuronChatPanel({ blocks, neuronTitle, isVisible }: NeuronChatPanelProps) {
  const { t } = useTranslation("common");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { toast.error(t("toast_not_authenticated")); setIsStreaming(false); return; }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          neuron_context: {
            title: neuronTitle,
            blocks: blocks.filter(b => b.content?.trim()).map(b => ({ type: b.type, content: b.content })),
          },
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: "AI error" }));
        throw new Error(errorData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Unknown error";
      setMessages(prev => {
        // Replace empty assistant or add error
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          return [...prev.slice(0, -1), { role: "assistant", content: `⚠️ ${errorMsg}` }];
        }
        return [...prev, { role: "assistant", content: `⚠️ ${errorMsg}` }];
      });
    }

    setIsStreaming(false);
  }, [input, isStreaming, messages, blocks, neuronTitle]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ai-border">
        <span className="text-micro font-semibold uppercase tracking-wider text-ai-accent flex items-center gap-1.5">
          <MessageCircle className="h-3 w-3" />
          {t("neuron_editor.neuron_chat")}
        </span>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-muted-foreground hover:text-destructive transition-colors" title={t("neuron_editor.clear_chat")}>
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <Sparkles className="h-6 w-6 text-ai-accent/30 mb-2" />
            <p className="text-micro text-muted-foreground leading-relaxed">
              {t("neuron_editor.chat_hint")}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-ai-bg border border-ai-border"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose-compact">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {isStreaming && i === messages.length - 1 && (
                    <span className="inline-block w-1.5 h-3.5 bg-ai-accent animate-pulse ml-0.5 -mb-0.5" />
                  )}
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-2 py-2 border-t border-border">
        <div className="flex items-end gap-1.5 bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-ai-accent transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this neuron..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-xs resize-none outline-none placeholder:text-muted-foreground/50 max-h-20 min-h-[20px]"
            style={{ height: "auto", overflow: "hidden" }}
            onInput={e => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 80) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className={cn(
              "shrink-0 p-1 rounded transition-colors",
              input.trim() && !isStreaming
                ? "text-ai-accent hover:bg-ai-accent/10"
                : "text-muted-foreground/30"
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
