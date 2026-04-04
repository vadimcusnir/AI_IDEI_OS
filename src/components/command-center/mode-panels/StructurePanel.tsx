/**
 * StructurePanel — Framework grouping, taxonomy, structuring.
 */
import { motion } from "framer-motion";
import { LayoutGrid, GitBranch, Layers, Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface StructurePanelProps {
  onCommand: (prompt: string) => void;
}

const STRUCTURE_ACTIONS = [
  { icon: LayoutGrid, label: "Taxonomie automată", desc: "Grupare pe teme", prompt: "/structure auto-taxonomy for neurons", accent: "bg-violet-500/10 text-violet-400" },
  { icon: GitBranch, label: "Decision Tree", desc: "Arbore de decizie", prompt: "/structure decision tree from frameworks", accent: "bg-blue-500/10 text-blue-400" },
  { icon: Layers, label: "Framework Builder", desc: "Construiește framework", prompt: "/structure build framework from insights", accent: "bg-emerald-500/10 text-emerald-400" },
  { icon: Network, label: "Knowledge Map", desc: "Hartă de conexiuni", prompt: "/structure knowledge map visualization", accent: "bg-amber-500/10 text-amber-400" },
];

export function StructurePanel({ onCommand }: StructurePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="py-2 space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <LayoutGrid className="h-3 w-3 text-violet-400" />
          <span className="text-micro font-medium text-muted-foreground/70">Structurare & Organizare</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {STRUCTURE_ACTIONS.map((action) => (
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
