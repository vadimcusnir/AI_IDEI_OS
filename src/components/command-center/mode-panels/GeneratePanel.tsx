/**
 * GeneratePanel — Quick actions for content generation.
 */
import { motion } from "framer-motion";
import { PenTool, Zap, FileText, BookOpen, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneratePanelProps {
  onCommand: (prompt: string) => void;
}

const GENERATE_ACTIONS = [
  { icon: Zap, label: "Hook-uri de conversie", desc: "10+ variante", prompt: "/generate 10 conversion hooks", accent: "bg-success/10 text-success" },
  { icon: PenTool, label: "Articol complet", desc: "Din neuroni selectați", prompt: "/generate article from selected neurons", accent: "bg-info/10 text-info" },
  { icon: FileText, label: "Serie LinkedIn", desc: "5 postări optimizate", prompt: "/generate LinkedIn post series", accent: "bg-ai-accent/10 text-ai-accent" },
  { icon: Mail, label: "Email Sequence", desc: "Nurturing 7 emails", prompt: "/generate email nurturing sequence 7 emails", accent: "bg-gold/10 text-gold" },
  { icon: BookOpen, label: "Mini-curs", desc: "10 micro-lecții", prompt: "/generate 10 micro-lessons from neurons", accent: "bg-destructive/10 text-destructive" },
  { icon: Zap, label: "CTA Pack", desc: "20 CTA-uri testate", prompt: "/generate 20 high-converting CTAs", accent: "bg-petrol/10 text-petrol" },
];

export function GeneratePanel({ onCommand }: GeneratePanelProps) {
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
          <PenTool className="h-3 w-3 text-success" />
          <span className="text-micro font-medium text-muted-foreground/70">Generare conținut</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {GENERATE_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onCommand(action.prompt)}
              className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/40 hover:bg-card/80 hover:border-border/50 transition-all text-left"
            >
              <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", action.accent)}>
                <action.icon className="h-3 w-3" />
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
