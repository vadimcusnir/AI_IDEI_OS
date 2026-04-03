/**
 * CommandBubble — World-class message display.
 * Best practices: centered column, proper text size, hover actions, code copy.
 */

import { cn } from "@/lib/utils";
import { Sparkles, User, Copy, Check, RotateCcw, Pencil } from "lucide-react";
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
  onRetry?: () => void;
  onEdit?: (content: string) => void;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code my-3 -mx-1">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/80 border border-border/40 rounded-t-xl">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none !rounded-b-xl !border-t-0 overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function CommandBubble({ msg, isStreaming, onRetry, onEdit }: CommandBubbleProps) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  if (isUser) {
    return (
      <div className="flex justify-end group">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="relative">
            <div className="bg-[hsl(var(--gold-oxide))] text-[hsl(var(--obsidian))] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm shadow-[hsl(var(--gold-oxide)/0.1)]">
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {/* User message actions */}
            <div className="absolute -bottom-6 right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
              {onEdit && (
                <button
                  onClick={() => onEdit(msg.content)}
                  className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                title="Copy"
              >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
          <div className="h-7 w-7 rounded-full bg-foreground/[0.08] flex items-center justify-center shrink-0 mt-0.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex group">
      <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[85%]">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[hsl(var(--gold-oxide)/0.15)] to-[hsl(var(--gold-oxide)/0.05)] flex items-center justify-center shrink-0 mt-0.5 border border-[hsl(var(--gold-oxide)/0.1)]">
          <Sparkles className="h-3 w-3 text-[hsl(var(--gold-oxide))]" />
        </div>
        <div className="relative min-w-0">
          <div className="text-sm leading-[1.7] text-foreground">
            <div className="prose prose-sm dark:prose-invert max-w-none
              [&_p]:mb-3 [&_p]:last:mb-0
              [&_ul]:mb-3 [&_ol]:mb-3
              [&_li]:mb-1 [&_li]:text-[14px]
              [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2
              [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
              [&_code]:text-[13px] [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:border [&_code]:border-border/30
              [&_pre]:bg-muted/60 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/40 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0
              [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
              [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary/80
              [&_hr]:border-border/40 [&_hr]:my-4
              [&_table]:border-collapse [&_th]:border [&_th]:border-border/40 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-xs [&_th]:font-semibold [&_th]:bg-muted/50
              [&_td]:border [&_td]:border-border/40 [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-sm
              [&_strong]:font-semibold [&_strong]:text-foreground
            ">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const isBlock = className?.startsWith("language-");
                    if (isBlock) {
                      return <CodeBlock className={className}>{String(children).replace(/\n$/, "")}</CodeBlock>;
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
          {isStreaming && (
            <span className="inline-block w-[3px] h-5 bg-[hsl(var(--gold-oxide)/0.6)] animate-pulse rounded-full ml-0.5 -mb-1" />
          )}

          {/* Assistant message actions */}
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

export type { Message };
