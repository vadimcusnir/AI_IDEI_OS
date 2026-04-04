/**
 * SessionList — Displays past chat sessions with switch/delete capabilities.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Trash2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ChatSession } from "@/hooks/useChatHistory";

interface SessionListProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  className?: string;
}

export function SessionList({
  sessions,
  currentSessionId,
  onSelect,
  onDelete,
  className,
}: SessionListProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleSessions = expanded ? sessions : sessions.slice(0, 5);

  if (sessions.length === 0) return null;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-micro font-medium text-muted-foreground uppercase tracking-wider">
          Recent Sessions
        </span>
        <span className="text-nano text-muted-foreground/60">{sessions.length}</span>
      </div>

      <AnimatePresence initial={false}>
        {visibleSessions.map((session) => (
          <motion.button
            key={session.session_id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onClick={() => onSelect(session.session_id)}
            className={cn(
              "w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left transition-colors group",
              session.session_id === currentSessionId
                ? "bg-accent/50 text-foreground"
                : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-dense font-medium truncate leading-tight">
                {session.last_message || "Empty session"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="h-2.5 w-2.5" />
                <span className="text-nano">
                  {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                </span>
                <span className="text-nano text-muted-foreground/50">
                  · {session.message_count} msgs
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.session_id);
              }}
            >
              <Trash2 className="h-2.5 w-2.5 text-destructive" />
            </Button>
          </motion.button>
        ))}
      </AnimatePresence>

      {sessions.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full h-6 text-nano text-muted-foreground/60 gap-1"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Show less" : `Show ${sessions.length - 5} more`}
        </Button>
      )}
    </div>
  );
}
