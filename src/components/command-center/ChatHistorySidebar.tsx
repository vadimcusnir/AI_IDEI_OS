/**
 * ChatHistorySidebar — ChatGPT-style left sidebar with conversation history.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, Trash2, Search,
  PanelLeftClose, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ChatSession } from "@/hooks/useChatHistory";

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isOpen: boolean;
  onToggle: () => void;
  onNewSession: () => void;
  onLoadSession: (sid: string) => void;
  onDeleteSession: (sid: string) => void;
}

export function ChatHistorySidebar({
  sessions, currentSessionId, isOpen, onToggle,
  onNewSession, onLoadSession, onDeleteSession,
}: ChatHistorySidebarProps) {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = search
    ? sessions.filter(s => s.last_message.toLowerCase().includes(search.toLowerCase()))
    : sessions;

  // Group sessions by date
  const today = new Date();
  const groups: Record<string, ChatSession[]> = {};
  
  for (const s of filtered) {
    const date = new Date(s.created_at);
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    let group: string;
    if (diffDays === 0) group = "Astăzi";
    else if (diffDays === 1) group = "Ieri";
    else if (diffDays < 7) group = "Ultimele 7 zile";
    else if (diffDays < 30) group = "Ultimele 30 zile";
    else group = "Mai vechi";
    
    if (!groups[group]) groups[group] = [];
    groups[group].push(s);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:flex flex-col h-full border-r border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden shrink-0"
          >
            <SidebarContent
              groups={groups}
              currentSessionId={currentSessionId}
              search={search}
              onSearchChange={setSearch}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onNewSession={onNewSession}
              onLoadSession={onLoadSession}
              onDeleteSession={onDeleteSession}
              onClose={onToggle}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={onToggle}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 w-[280px] z-50 bg-card border-r border-border shadow-2xl"
            >
              <SidebarContent
                groups={groups}
                currentSessionId={currentSessionId}
                search={search}
                onSearchChange={setSearch}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onNewSession={onNewSession}
                onLoadSession={onLoadSession}
                onDeleteSession={onDeleteSession}
                onClose={onToggle}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  groups, currentSessionId, search, onSearchChange,
  hoveredId, onHover, onNewSession, onLoadSession, onDeleteSession, onClose,
}: {
  groups: Record<string, ChatSession[]>;
  currentSessionId: string;
  search: string;
  onSearchChange: (v: string) => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onNewSession: () => void;
  onLoadSession: (sid: string) => void;
  onDeleteSession: (sid: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/30">
        <button
          onClick={onNewSession}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Sesiune nouă
        </button>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Caută conversații..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted/50 border border-border/30 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30"
          />
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="mb-3">
            <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground/40 px-2 py-1.5">
              {groupName}
            </p>
            {items.map((s) => (
              <button
                key={s.session_id}
                onClick={() => onLoadSession(s.session_id)}
                onMouseEnter={() => onHover(s.session_id)}
                onMouseLeave={() => onHover(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-150 group",
                  "text-sm",
                  currentSessionId === s.session_id
                    ? "bg-muted/80 text-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-40" />
                <span className="truncate flex-1 text-compact">{s.last_message || "Sesiune nouă"}</span>
                {hoveredId === s.session_id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(s.session_id); }}
                    className="p-1 rounded text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </button>
            ))}
          </div>
        ))}

        {Object.keys(groups).length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground/40">
            Nicio conversație încă
          </div>
        )}
      </div>
    </div>
  );
}
