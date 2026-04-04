/**
 * LibraryPanel — Browse neurons, frameworks, saved outputs.
 */
import { motion } from "framer-motion";
import { Library, Brain, Bookmark, FolderOpen, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryPanelProps {
  onCommand: (prompt: string) => void;
  neuronCount?: number;
}

const LIBRARY_ACTIONS = [
  { icon: Brain, label: "Neuroni recenți", desc: "Ultimii 20 extrași", prompt: "/library show recent neurons", accent: "bg-cyan-500/10 text-cyan-400" },
  { icon: FolderOpen, label: "Frameworks", desc: "Toate framework-urile", prompt: "/library list all frameworks", accent: "bg-violet-500/10 text-violet-400" },
  { icon: Bookmark, label: "Salvate", desc: "Output-uri salvate", prompt: "/library show saved outputs", accent: "bg-amber-500/10 text-amber-400" },
  { icon: Filter, label: "Caută în bază", desc: "Filtrare avansată", prompt: "/library search neurons ", accent: "bg-emerald-500/10 text-emerald-400" },
];

export function LibraryPanel({ onCommand, neuronCount = 0 }: LibraryPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="py-2 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Library className="h-3 w-3 text-cyan-400" />
            <span className="text-micro font-medium text-muted-foreground/70">Bibliotecă</span>
          </div>
          {neuronCount > 0 && (
            <span className="text-micro text-muted-foreground/40">{neuronCount} total</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LIBRARY_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onCommand(action.prompt)}
              className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/40 hover:bg-card/80 hover:border-border/50 transition-all text-left"
            >
              <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", action.accent)}>
                <action.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-dense font-medium text-foreground/90 leading-tight">{action.label}</p>
                <p className="text-nano text-muted-foreground/50 leading-tight">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
