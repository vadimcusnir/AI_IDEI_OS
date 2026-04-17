import ReactMarkdown from "react-markdown";
import { Terminal, User, Copy, Check, RotateCcw } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface AgentBubbleProps {
  msg: Message;
  onNavigate: (path: string) => void;
  isStreaming?: boolean;
  onRetry?: () => void;
}

export function AgentBubble({ msg, isStreaming, onRetry }: AgentBubbleProps) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  /* User turn — right-aligned soft chip */
  if (isUser) {
    return (
      <div className="flex justify-end group">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="relative">
            <div className="bg-muted/80 text-foreground border border-border/30 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            <div className="absolute -bottom-6 right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                title="Copy"
              >
                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
          <div className="h-7 w-7 rounded-full bg-foreground/[0.08] flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  /* Assistant turn — left-aligned, generous prose, no bubble */
  return (
    <div className="flex group">
      <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[85%] min-w-0">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/15" aria-hidden="true">
          <Terminal className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="relative min-w-0 flex-1">
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-sm leading-[1.7] text-foreground
              [&_p]:mb-3 [&_p]:last:mb-0
              [&_ul]:mb-3 [&_ol]:mb-3
              [&_li]:mb-1
              [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm
              [&_code]:text-compact [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:border [&_code]:border-border/30
              [&_pre]:bg-card/80 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/50 [&_pre]:p-3
              [&_strong]:font-semibold [&_strong]:text-foreground"
            role="log"
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
          {isStreaming && (
            <span
              className="inline-block w-[3px] h-5 bg-primary/60 animate-pulse rounded-full ml-1 -mb-1"
              aria-label="Typing"
            />
          )}

          {!isStreaming && msg.content.length > 10 && (
            <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
                title="Copy"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
                  title="Retry"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
