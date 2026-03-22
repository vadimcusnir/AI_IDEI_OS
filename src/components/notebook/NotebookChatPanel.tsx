import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Notebook, NotebookMessage } from "@/hooks/useNotebook";
import type { UseMutationResult } from "@tanstack/react-query";

interface Props {
  notebook: Notebook | undefined;
  messages: NotebookMessage[];
  sendMessage: UseMutationResult<void, Error, string>;
  updateTitle: UseMutationResult<void, Error, string>;
}

const SUGGESTED_PROMPTS = [
  "Summarize all sources",
  "Extract key frameworks",
  "Find contradictions",
  "Generate action items",
];

export function NotebookChatPanel({ notebook, messages, sendMessage, updateTitle }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage.mutate(text);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <input
          value={notebook?.title || ""}
          onChange={(e) => updateTitle.mutate(e.target.value)}
          className="text-xl font-semibold bg-transparent border-none outline-none text-foreground w-full placeholder:text-muted-foreground/30"
          placeholder="Untitled Notebook"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {notebook?.source_count || 0} sources connected
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-10 w-10 text-primary/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Start a conversation</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Ask questions about your sources, extract insights, or generate content.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="px-4 py-2 text-xs rounded-full border border-border bg-card hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
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
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
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
            placeholder="Ask about your sources..."
            rows={1}
            className="flex-1 resize-none bg-card border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/30 min-h-[44px] max-h-32"
          />
          <Button
            size="icon"
            className="h-11 w-11 rounded-full shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
