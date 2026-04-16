import ReactMarkdown from "react-markdown";
import { Terminal, User } from "lucide-react";
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
}

export function AgentBubble({ msg, isStreaming }: AgentBubbleProps) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
          <Terminal className="h-3 w-3 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[85%] text-xs leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
        role={isUser ? undefined : "log"}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_li]:text-xs [&_code]:text-micro [&_code]:bg-background/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3 bg-primary/60 animate-pulse ml-0.5 rounded-sm" aria-label="Typing" />
        )}
      </div>
      {isUser && (
        <div className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
          <User className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}
