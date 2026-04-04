/**
 * CommandBubble — AI-native command interface message display.
 * Semantic blocks, link detection, command highlighting, OS-grade rendering.
 */

import { cn } from "@/lib/utils";
import { Sparkles, User, Copy, Check, RotateCcw, Pencil, ExternalLink, Terminal, DollarSign, Activity, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState, useCallback, useMemo } from "react";

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

/* ── Semantic block detection ── */
type SemanticType = "pipeline" | "cost" | "status" | "action" | null;

function detectSemanticType(content: string): SemanticType {
  const lower = content.toLowerCase();
  if (/plan de execu[tț]ie|pipeline|execution plan/i.test(content)) return "pipeline";
  if (/cost total|balan[tț][aă]|credits?:|neurons?:/i.test(content)) return "cost";
  if (/status|starea|✅|completed|running/i.test(content)) return "status";
  if (/\bSTART\b|\bCONFIRM[AĂ]\b|▶|launch/i.test(content)) return "action";
  return null;
}

const SEMANTIC_STYLES: Record<string, string> = {
  pipeline: "border-l-2 border-l-info bg-info/[0.04]",
  cost: "border-l-2 border-l-warning bg-warning/[0.04]",
  status: "border-l-2 border-l-success bg-success/[0.04]",
  action: "border border-warning/30 bg-warning/[0.04] text-center",
};

const SEMANTIC_ICONS: Record<string, React.ReactNode> = {
  pipeline: <Terminal className="h-3.5 w-3.5 text-info" />,
  cost: <DollarSign className="h-3.5 w-3.5 text-warning" />,
  status: <Activity className="h-3.5 w-3.5 text-success" />,
  action: <Zap className="h-3.5 w-3.5 text-warning" />,
};

/* ── Inline text transforms (links + /commands) ── */
function renderUserContent(text: string) {
  // Split by URLs and /commands
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const cmdRegex = /(\/[a-zA-Z0-9_]+)/g;
  
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  const combined = new RegExp(`(https?:\\/\\/[^\\s]+)|(\\/[a-zA-Z0-9_]+)`, "g");
  let match: RegExpExecArray | null;
  let key = 0;
  
  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (match[1]) {
      // URL
      parts.push(
        <a
          key={key++}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-info underline underline-offset-2 hover:text-info/80 transition-colors inline-flex items-center gap-0.5"
        >
          {match[1].length > 50 ? match[1].slice(0, 50) + "…" : match[1]}
          <ExternalLink className="h-2.5 w-2.5 inline shrink-0" />
        </a>
      );
    } else if (match[2]) {
      // Command
      parts.push(
        <span
          key={key++}
          className="inline-block bg-muted border border-border/40 text-warning font-semibold text-compact px-1.5 py-0.5 rounded-md font-mono"
        >
          {match[2]}
        </span>
      );
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts.length > 0 ? parts : text;
}

/* ── Code block with copy ── */
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
      <div className="flex items-center justify-between px-3 py-1.5 bg-card border border-border/50 rounded-t-xl">
        <span className="text-micro font-mono text-muted-foreground/60 uppercase tracking-wider">{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="text-micro text-muted-foreground/50 hover:text-foreground transition-colors flex items-center gap-1"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none !rounded-b-xl !border-t-0 !bg-card/80 !border-border/50 overflow-x-auto">
        <code className={cn(className, "font-mono text-compact")}>{children}</code>
      </pre>
    </div>
  );
}

/* ── Main component ── */
export function CommandBubble({ msg, isStreaming, onRetry, onEdit }: CommandBubbleProps) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  const [copied, setCopied] = useState(false);

  const semanticType = useMemo(() => 
    !isUser ? detectSemanticType(msg.content) : null
  , [msg.content, isUser]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  /* ── System message ── */
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="border-l-2 border-l-success bg-success/[0.04] rounded-lg px-4 py-2.5 max-w-[85%] text-compact text-muted-foreground">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  /* ── User message ── */
  if (isUser) {
    return (
      <div className="flex justify-end group">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="relative">
            <div className="bg-gold text-obsidian rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm shadow-gold/10">
              <p className="whitespace-pre-wrap">{renderUserContent(msg.content)}</p>
            </div>
            <div className="absolute -bottom-6 right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
              {onEdit && (
                <button onClick={() => onEdit(msg.content)} className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors" title="Edit">
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              <button onClick={handleCopy} className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors" title="Copy">
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

  /* ── Assistant message ── */
  return (
    <div className="flex group">
      <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[85%]">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gold/15 to-gold/5 flex items-center justify-center shrink-0 mt-0.5 border border-gold/10">
          {semanticType ? SEMANTIC_ICONS[semanticType] : <Sparkles className="h-3 w-3 text-gold" />}
        </div>
        <div className="relative min-w-0">
          <div className={cn(
            "text-sm leading-[1.7] text-foreground rounded-xl px-1",
            semanticType && SEMANTIC_STYLES[semanticType] && `${SEMANTIC_STYLES[semanticType]} p-3 rounded-xl`,
          )}>
            <div className="prose prose-sm dark:prose-invert max-w-none
              [&_p]:mb-3 [&_p]:last:mb-0
              [&_ul]:mb-3 [&_ol]:mb-3
              [&_li]:mb-1 [&_li]:text-sm
              [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3
              [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
              [&_code]:text-compact [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:border [&_code]:border-border/30
              [&_pre]:bg-card/80 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/50 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0
              [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
              [&_a]:text-info [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-info/80 [&_a]:transition-colors
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
                  a({ href, children, ...props }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5" {...props}>
                        {children}
                        <ExternalLink className="h-2.5 w-2.5 inline shrink-0 ml-0.5" />
                      </a>
                    );
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
          {isStreaming && (
            <span className="inline-block w-[3px] h-5 bg-gold/60 animate-pulse rounded-full ml-1 -mb-1" />
          )}

          {/* Actions */}
          {!isStreaming && msg.content.length > 10 && (
            <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button onClick={handleCopy} className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors" title="Copy">
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              {onRetry && (
                <button onClick={onRetry} className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors" title="Retry">
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
