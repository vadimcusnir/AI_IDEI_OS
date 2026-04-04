/**
 * InlineServiceSuggestions — Live intent detection as user types.
 * Shows matching services below the input in real-time.
 * NotebookLM-style context-aware suggestions.
 */
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, PenTool, BarChart3, Target, Layers,
  Search, Upload, Zap, FileText, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceSuggestion {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  prompt: string;
  credits: number;
}

interface InlineServiceSuggestionsProps {
  input: string;
  onSelect: (prompt: string) => void;
  visible: boolean;
}

// Intent → Service mapping
const SERVICE_MAP: Array<{
  keywords: string[];
  services: ServiceSuggestion[];
}> = [
  {
    keywords: ["analiz", "competit", "concuren", "piață", "market"],
    services: [
      { id: "competitor_analysis", label: "Analiză competitori", description: "Analiză detaliată a competitorilor", icon: Target, prompt: "/analyze competitors in my market", credits: 50 },
      { id: "market_map", label: "Hartă de piață", description: "Poziționare și oportunități", icon: BarChart3, prompt: "/analyze market positioning and opportunities", credits: 75 },
      { id: "positioning_report", label: "Raport poziționare", description: "Strategie de diferențiere", icon: TrendingUp, prompt: "/generate positioning strategy report", credits: 60 },
    ],
  },
  {
    keywords: ["extrag", "neuron", "extract", "transcri", "upload"],
    services: [
      { id: "extract_neurons", label: "Extrage neuroni", description: "Framework-uri, pattern-uri, formule", icon: Brain, prompt: "/extract neurons from content", credits: 35 },
      { id: "transcribe", label: "Transcrie & segmentează", description: "Audio/video în text structurat", icon: Upload, prompt: "/extract transcribe and segment content", credits: 25 },
      { id: "deep_extract", label: "Extracție profundă", description: "Insight-uri psihologice, JTBD", icon: Search, prompt: "/extract deep psychological insights and JTBD patterns", credits: 80 },
    ],
  },
  {
    keywords: ["genere", "articol", "scrie", "content", "post", "copy", "scri"],
    services: [
      { id: "generate_articles", label: "Generează articole", description: "Articole din neuroni existenți", icon: PenTool, prompt: "/generate articles from existing neurons", credits: 40 },
      { id: "generate_hooks", label: "Hook-uri copywriting", description: "10+ hook-uri de conversie", icon: Zap, prompt: "/generate 10 copywriting hooks from patterns", credits: 30 },
      { id: "generate_series", label: "Serie LinkedIn", description: "5 postări optimizate", icon: FileText, prompt: "/generate LinkedIn post series from top frameworks", credits: 45 },
    ],
  },
  {
    keywords: ["funnel", "strategi", "plan", "build", "constru", "sistem"],
    services: [
      { id: "build_funnel", label: "Funnel de vânzare", description: "Pipeline complet de conversie", icon: Layers, prompt: "/build complete sales funnel from best frameworks", credits: 100 },
      { id: "strategy", label: "Strategie de conținut", description: "Plan pe 30 de zile", icon: Target, prompt: "/build content strategy plan for next 30 days", credits: 60 },
      { id: "email_sequence", label: "Email sequence", description: "Secvență de lead nurturing", icon: PenTool, prompt: "/build email nurturing sequence 7 emails", credits: 55 },
    ],
  },
  {
    keywords: ["curs", "cour", "educ", "train", "learn"],
    services: [
      { id: "generate_course", label: "Generează curs", description: "Curs complet din conținut", icon: Brain, prompt: "/generate complete course from my content", credits: 120 },
      { id: "micro_lessons", label: "Micro-lecții", description: "10 lecții de 5 minute", icon: FileText, prompt: "/generate 10 micro-lessons from neurons", credits: 60 },
    ],
  },
];

export function InlineServiceSuggestions({ input, onSelect, visible }: InlineServiceSuggestionsProps) {
  const suggestions = useMemo(() => {
    if (!input || input.length < 3 || input.startsWith("/")) return [];

    const lower = input.toLowerCase();
    const matched: ServiceSuggestion[] = [];

    for (const entry of SERVICE_MAP) {
      if (entry.keywords.some(kw => lower.includes(kw))) {
        matched.push(...entry.services);
      }
    }

    return matched.slice(0, 3); // Max 3 suggestions
  }, [input]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className="max-w-3xl mx-auto px-4 sm:px-6"
      >
        <div className="flex items-center gap-1.5 mb-1.5 px-1">
          <Zap className="h-3 w-3 text-primary/50" />
          <span className="text-micro text-muted-foreground/50 font-medium">Servicii detectate</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {suggestions.map((svc) => (
            <button
              key={svc.id}
              onClick={() => onSelect(svc.prompt)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl border shrink-0",
                "bg-card/60 backdrop-blur-sm border-border/40",
                "hover:border-primary/30 hover:bg-primary/[0.04] transition-all duration-200",
                "group"
              )}
            >
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <svc.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-medium text-foreground leading-tight">{svc.label}</p>
                <p className="text-micro text-muted-foreground/60 leading-tight">{svc.description}</p>
              </div>
              <span className="text-micro text-primary/60 font-mono shrink-0">{svc.credits}n</span>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}