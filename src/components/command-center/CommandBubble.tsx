/**
 * CommandBubble — Message display for Command Center.
 * Renders user messages and AI responses with markdown support.
 */

import { cn } from "@/lib/utils";
import { Command, User, Copy, Check } from "lucide-react";
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
    <div className={cn("flex gap-2.5 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Command className="h-3 w-3 text-primary" />
        </div>
      )}
      <div className="relative">
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

        {/* Copy button — assistant messages only */}
        {!isUser && !isStreaming && msg.content.length > 20 && (
          <button
            onClick={handleCopy}
            className="absolute -right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-card border border-border shadow-sm"
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
        <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

export type { Message };
