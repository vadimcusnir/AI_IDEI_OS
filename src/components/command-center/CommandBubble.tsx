/**
 * CommandBubble — Message display for Command Center.
 * Premium aesthetic matching Home's design language.
 */

import { cn } from "@/lib/utils";
import { Sparkles, User, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface CommandBubbleProps {
  msg: Message;
  isStreaming?: boolean;
}

export function CommandBubble({ msg, isStreaming }: CommandBubbleProps) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  return (
    <div className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 mt-0.5 border border-primary/10">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
      )}
      <div className="relative max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-card border border-border/60 rounded-bl-sm shadow-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_p]:last:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_li]:text-sm [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_pre]:bg-muted [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/40 [&_blockquote]:border-primary/30 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:no-underline [&_a:hover]:underline [&_hr]:border-border/40">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary/50 animate-pulse ml-0.5 rounded-sm" />
          )}
        </div>

        {/* Copy button — assistant messages only */}
        {!isUser && !isStreaming && msg.content.length > 20 && (
          <button
            onClick={handleCopy}
            className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg bg-card border border-border/60 shadow-md hover:shadow-lg hover:border-border"
            title="Copy"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
      {isUser && (
        <div className="h-7 w-7 rounded-lg bg-foreground/[0.06] flex items-center justify-center shrink-0 mt-0.5 border border-border/40">
          <User className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export type { Message };
