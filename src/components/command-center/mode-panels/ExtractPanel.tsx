/**
 * ExtractPanel — Quick actions for content extraction.
 */
import { motion } from "framer-motion";
import { Upload, Mic, Globe, FileText, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtractPanelProps {
  onCommand: (prompt: string) => void;
  neuronCount?: number;
}

const EXTRACT_ACTIONS = [
  { icon: Upload, label: "Upload & Extract", desc: "Text, PDF, DOCX", prompt: "/extract upload", accent: "bg-blue-500/10 text-blue-400" },
  { icon: Mic, label: "Audio → Neuroni", desc: "MP3, WAV, M4A", prompt: "/extract audio to neurons", accent: "bg-violet-500/10 text-violet-400" },
  { icon: Globe, label: "URL → Insights", desc: "Extrage din orice URL", prompt: "/extract insights from URL ", accent: "bg-emerald-500/10 text-emerald-400" },
  { icon: FileText, label: "Transcript → Framework", desc: "Structurează transcript", prompt: "/extract frameworks from transcript", accent: "bg-amber-500/10 text-amber-400" },
];

export function ExtractPanel({ onCommand, neuronCount = 0 }: ExtractPanelProps) {
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
            <Brain className="h-3 w-3 text-blue-400" />
            <span className="text-micro font-medium text-muted-foreground/70">Extracție cunoștințe</span>
          </div>
          {neuronCount > 0 && (
            <span className="text-micro text-muted-foreground/40">{neuronCount} neuroni extrași</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {EXTRACT_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onCommand(action.prompt)}
              className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/40 hover:bg-card/80 hover:border-border/50 transition-all text-left group"
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
