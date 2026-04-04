import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type, Heading1, Heading2, FileText, CheckSquare, Quote as QuoteIcon,
  List, Lightbulb, BookOpen, Minus, Code, FileCode, Braces,
  MessageSquare, Table, GitBranch, Sparkles, Search
} from "lucide-react";
import { BlockType, BLOCK_TYPE_CONFIG, SLASH_COMMAND_ORDER } from "./types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  type: Type, heading: Heading1, "heading-2": Heading2, "file-text": FileText,
  "check-square": CheckSquare, quote: QuoteIcon, list: List, lightbulb: Lightbulb,
  "book-open": BookOpen, minus: Minus, code: Code, "file-cog": FileCode,
  braces: Braces, "message-square": MessageSquare, table: Table,
  "git-branch": GitBranch, sparkles: Sparkles,
};

const categoryLabels: Record<string, string> = {
  content: "Content",
  structure: "Structure",
  code: "Code & Data",
  ai: "AI & Execution",
};

const categoryOrder = ["content", "structure", "code", "ai"];

interface SlashCommandMenuProps {
  isOpen: boolean;
  filter: string;
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ isOpen, filter, position, onSelect, onClose }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = SLASH_COMMAND_ORDER.filter(type => {
    const cfg = BLOCK_TYPE_CONFIG[type];
    const q = filter.toLowerCase();
    return cfg.label.toLowerCase().includes(q) ||
      cfg.description.toLowerCase().includes(q) ||
      cfg.category.includes(q) ||
      type.includes(q);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) onSelect(filteredItems[selectedIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, filteredItems, selectedIndex, onSelect, onClose]);

  if (!isOpen || filteredItems.length === 0) return null;

  // Group by category
  const grouped: Record<string, BlockType[]> = {};
  filteredItems.forEach(type => {
    const cat = BLOCK_TYPE_CONFIG[type].category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(type);
  });

  let flatIndex = 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl w-64 max-h-80 overflow-y-auto"
        style={{ top: position.top, left: position.left }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <Search className="h-3 w-3 text-muted-foreground" />
          <span className="text-micro text-muted-foreground">
            {filter ? `Filtering: "${filter}"` : "Type to filter blocks"}
          </span>
        </div>

        {categoryOrder.map(cat => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat}>
              <div className="px-3 pt-2 pb-1">
                <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">
                  {categoryLabels[cat]}
                </span>
              </div>
              {items.map(type => {
                const cfg = BLOCK_TYPE_CONFIG[type];
                const Icon = iconMap[cfg.icon] || Type;
                const isSelected = flatIndex === selectedIndex;
                const idx = flatIndex;
                flatIndex++;
                return (
                  <button
                    key={type}
                    onClick={() => onSelect(type)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors text-left",
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded flex items-center justify-center shrink-0",
                      cfg.executable ? "bg-ai/60" : "bg-muted/60"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-1.5">
                        {cfg.label}
                        {cfg.executable && (
                          <span className="text-nano bg-primary/15 text-primary rounded px-1 py-0 font-semibold">RUN</span>
                        )}
                      </div>
                      <div className="text-micro text-muted-foreground truncate">{cfg.description}</div>
                    </div>
                    <span className="text-nano font-mono text-muted-foreground/40">/{type}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
