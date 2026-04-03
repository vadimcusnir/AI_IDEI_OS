/**
 * SessionHistoryPanel — Slide-out panel for chat session switching.
 * Shows recent sessions with preview of last message.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, X, MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Session {
  id: string;
  created_at: string;
  last_message?: string;
}

interface SessionHistoryPanelProps {
  sessions: Session[];
  currentSessionId?: string;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
  onDelete: (sessionId: string) => void;
  open: boolean;
  onClose: () => void;
}

export function SessionHistoryPanel({
  sessions, currentSessionId, onSelect, onNew, onDelete, open, onClose,
}: SessionHistoryPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] border-r border-border bg-card shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold">Sessions</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNew}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 text-center py-8">No sessions yet</p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => { onSelect(s.id); onClose(); }}
                    className={`group flex items-start gap-2 px-4 py-2.5 cursor-pointer transition-colors hover:bg-muted/50 ${
                      s.id === currentSessionId ? "bg-muted/70 border-l-2 border-primary" : ""
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {s.last_message || "Empty session"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3 w-3 text-destructive/60" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
