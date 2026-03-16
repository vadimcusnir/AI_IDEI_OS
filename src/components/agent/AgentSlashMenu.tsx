import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Brain, FileText, Network, Sparkles, Zap,
  BookOpen, Users, Search, BarChart3,
} from "lucide-react";

interface SlashCommand {
  command: string;
  label: string;
  description: string;
  icon: React.ElementType;
  template: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { command: "/analyze", label: "Analyze Source", description: "Process a URL or text through the full pipeline", icon: Globe, template: "/analyze " },
  { command: "/extract", label: "Extract Neurons", description: "Extract knowledge neurons from content", icon: Brain, template: "/extract " },
  { command: "/generate", label: "Generate Asset", description: "Create article, framework, or course", icon: Sparkles, template: "/generate " },
  { command: "/search", label: "Search Knowledge", description: "Query your knowledge graph", icon: Search, template: "/search " },
  { command: "/summarize", label: "Summarize", description: "Generate a summary of content or neurons", icon: FileText, template: "/summarize " },
  { command: "/compare", label: "Compare Sources", description: "Cross-reference multiple episodes", icon: BarChart3, template: "/compare " },
  { command: "/services", label: "Run Service", description: "Execute a specific AI service", icon: Zap, template: "/services " },
  { command: "/topics", label: "Topic Map", description: "Build or explore topic connections", icon: Network, template: "/topics " },
  { command: "/course", label: "Create Course", description: "Generate a course from neurons", icon: BookOpen, template: "/course " },
  { command: "/profile", label: "Guest Profile", description: "Analyze a speaker's profile", icon: Users, template: "/profile " },
];

interface AgentSlashMenuProps {
  input: string;
  onSelect: (template: string) => void;
  visible: boolean;
  onClose: () => void;
}

export function AgentSlashMenu({ input, onSelect, visible, onClose }: AgentSlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter commands based on input
  const query = input.startsWith("/") ? input.slice(1).toLowerCase() : "";
  const filtered = input === "/"
    ? SLASH_COMMANDS
    : SLASH_COMMANDS.filter(
        (c) =>
          c.command.slice(1).startsWith(query) ||
          c.label.toLowerCase().includes(query)
      );

  useEffect(() => {
    setSelectedIndex(0);
  }, [input]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].template);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, selectedIndex, filtered, onSelect, onClose]);

  if (!visible || filtered.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-[280px] overflow-y-auto"
      >
        <div className="px-3 py-2 border-b border-border">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Commands</p>
        </div>
        {filtered.map((cmd, i) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.command}
              onClick={() => onSelect(cmd.template)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                i === selectedIndex ? "bg-accent" : "hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                i === selectedIndex ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-foreground">{cmd.command}</span>
                  <span className="text-[10px] text-muted-foreground">{cmd.label}</span>
                </div>
                <p className="text-[9px] text-muted-foreground/70 truncate">{cmd.description}</p>
              </div>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

export { SLASH_COMMANDS };
export type { SlashCommand };
