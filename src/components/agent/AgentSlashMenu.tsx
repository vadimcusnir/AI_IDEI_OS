import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Brain, FileText, Network, Sparkles, Zap,
  BookOpen, Users, Search, BarChart3, Lightbulb,
  MessageCircle, Layers, Upload, Bot, Briefcase,
  Target, Palette, PenTool, Megaphone, TrendingUp,
  Shield, Database, Mic, Video, BookMarked,
  Workflow, GitBranch, Newspaper, Award, Hash,
} from "lucide-react";

interface SlashCommand {
  command: string;
  label: string;
  description: string;
  icon: React.ElementType;
  template: string;
  category: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  // ─── Core Pipeline ───
  { command: "/analyze", label: "Analyze Source", description: "Process a URL or text through the full pipeline", icon: Globe, template: "/analyze ", category: "pipeline" },
  { command: "/extract", label: "Extract Neurons", description: "Extract knowledge neurons from content", icon: Brain, template: "/extract ", category: "pipeline" },
  { command: "/transcribe", label: "Transcribe", description: "Transcribe audio/video from URL", icon: Mic, template: "/transcribe ", category: "pipeline" },
  { command: "/segment", label: "Segment Content", description: "Chunk transcript into semantic blocks", icon: Layers, template: "/segment ", category: "pipeline" },
  { command: "/pipeline", label: "Run Pipeline", description: "Execute full IMF pipeline on an episode", icon: Workflow, template: "/pipeline ", category: "pipeline" },

  // ─── Knowledge ───
  { command: "/search", label: "Search Knowledge", description: "Query your knowledge graph semantically", icon: Search, template: "/search ", category: "knowledge" },
  { command: "/summarize", label: "Summarize", description: "Generate a summary of content or neurons", icon: FileText, template: "/summarize ", category: "knowledge" },
  { command: "/compare", label: "Compare Sources", description: "Cross-reference multiple episodes", icon: BarChart3, template: "/compare ", category: "knowledge" },
  { command: "/topics", label: "Topic Map", description: "Build or explore topic connections", icon: Network, template: "/topics ", category: "knowledge" },
  { command: "/relate", label: "Find Relations", description: "Discover connections between neurons", icon: GitBranch, template: "/relate ", category: "knowledge" },
  { command: "/contradictions", label: "Find Contradictions", description: "Detect conflicting statements in knowledge", icon: Shield, template: "/contradictions ", category: "knowledge" },

  // ─── Generation ───
  { command: "/generate", label: "Generate Asset", description: "Create article, framework, or course", icon: Sparkles, template: "/generate ", category: "generation" },
  { command: "/article", label: "Write Article", description: "Generate a long-form article from neurons", icon: Newspaper, template: "/article ", category: "generation" },
  { command: "/course", label: "Create Course", description: "Generate a course from neurons", icon: BookOpen, template: "/course ", category: "generation" },
  { command: "/social", label: "Social Posts", description: "Generate social media posts from insights", icon: Megaphone, template: "/social ", category: "generation" },
  { command: "/script", label: "Write Script", description: "Generate a video/podcast script", icon: Video, template: "/script ", category: "generation" },
  { command: "/copy", label: "Copywriting", description: "Generate marketing copy from frameworks", icon: PenTool, template: "/copy ", category: "generation" },
  { command: "/webinar", label: "Create Webinar", description: "Generate a webinar outline + slides text", icon: BookMarked, template: "/webinar ", category: "generation" },
  { command: "/funnel", label: "Build Funnel", description: "Design a marketing funnel from patterns", icon: Target, template: "/funnel ", category: "generation" },

  // ─── Services ───
  { command: "/services", label: "Run Service", description: "Execute a specific AI service", icon: Zap, template: "/services ", category: "services" },
  { command: "/avatar33", label: "Avatar 33", description: "Deep psychological profile analysis", icon: Bot, template: "/avatar33 ", category: "services" },
  { command: "/profile", label: "Guest Profile", description: "Analyze a speaker's profile", icon: Users, template: "/profile ", category: "services" },
  { command: "/brand", label: "Brand Analysis", description: "Extract brand patterns from content", icon: Palette, template: "/brand ", category: "services" },

  // ─── System ───
  { command: "/status", label: "System Status", description: "Check credits, jobs, and system health", icon: BarChart3, template: "/status ", category: "system" },
  { command: "/credits", label: "Credit Balance", description: "Check your NEURONS balance", icon: Award, template: "/credits ", category: "system" },
  { command: "/jobs", label: "Job Status", description: "View running and recent jobs", icon: Briefcase, template: "/jobs ", category: "system" },
  { command: "/export", label: "Export Data", description: "Export neurons, artifacts, or graphs", icon: Upload, template: "/export ", category: "system" },
  { command: "/stats", label: "Analytics", description: "View your usage statistics", icon: TrendingUp, template: "/stats ", category: "system" },
  { command: "/db", label: "Query Database", description: "Search neurons by filters", icon: Database, template: "/db ", category: "system" },
  { command: "/help", label: "Help", description: "Show all commands and usage tips", icon: Lightbulb, template: "/help ", category: "system" },
  { command: "/feedback", label: "Send Feedback", description: "Report a bug or suggest a feature", icon: MessageCircle, template: "/feedback ", category: "system" },
  { command: "/tags", label: "Tag Manager", description: "View and manage content tags", icon: Hash, template: "/tags ", category: "system" },
];

const CATEGORY_LABELS: Record<string, string> = {
  pipeline: "Pipeline",
  knowledge: "Knowledge",
  generation: "Generation",
  services: "Services",
  system: "System",
};

interface AgentSlashMenuProps {
  input: string;
  onSelect: (template: string) => void;
  visible: boolean;
  onClose: () => void;
}

export function AgentSlashMenu({ input, onSelect, visible, onClose }: AgentSlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const query = input.startsWith("/") ? input.slice(1).toLowerCase() : "";
  const filtered = input === "/"
    ? SLASH_COMMANDS
    : SLASH_COMMANDS.filter(
        (c) =>
          c.command.slice(1).startsWith(query) ||
          c.label.toLowerCase().includes(query) ||
          c.category.includes(query)
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

  // Group by category
  const grouped = filtered.reduce<Record<string, SlashCommand[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  let globalIdx = 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-[340px] overflow-y-auto"
      >
        {Object.entries(grouped).map(([cat, cmds]) => (
          <div key={cat}>
            <div className="px-3 py-1.5 border-b border-border sticky top-0 bg-popover/95 backdrop-blur-sm">
              <p className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABELS[cat] || cat}
              </p>
            </div>
            {cmds.map((cmd) => {
              const idx = globalIdx++;
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.command}
                  onClick={() => onSelect(cmd.template)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                    idx === selectedIndex ? "bg-accent" : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                    idx === selectedIndex ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-foreground">{cmd.command}</span>
                      <span className="text-micro text-muted-foreground">{cmd.label}</span>
                    </div>
                    <p className="text-nano text-muted-foreground/70 truncate">{cmd.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

export { SLASH_COMMANDS };
export type { SlashCommand };
