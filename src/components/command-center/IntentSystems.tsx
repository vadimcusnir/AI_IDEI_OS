/**
 * IntentSystems — Decision Engine UI.
 * Maps user goals to Systems (execution packs) instead of raw Actions.
 * Flow: Intent → Top 3 Systems → Preview → Execute
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Users, Megaphone, BookOpen, Layers, TrendingUp,
  ArrowRight, Zap, ChevronRight, Sparkles, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";

// ═══ System definitions ═══

export interface MMSystem {
  id: string;
  name: string;
  tagline: string;
  icon: React.ElementType;
  category: "acquisition" | "content" | "strategy" | "knowledge" | "monetization";
  outputs: string[];
  estimatedCredits: number;
  estimatedOutputs: number;
  prompt: string;
  steps: string[];
}

const MMS_REGISTRY: MMSystem[] = [
  // ─── ACQUISITION ───
  {
    id: "client-acquisition",
    name: "Client Acquisition System",
    tagline: "De la zero la primii 10 clienți",
    icon: Users,
    category: "acquisition",
    outputs: ["ICP Analysis", "Outreach Scripts ×5", "Cold Email Sequence", "LinkedIn Hooks ×10", "Objection Handler"],
    estimatedCredits: 350,
    estimatedOutputs: 25,
    prompt: "/mms client-acquisition — generate complete client acquisition system with ICP, outreach, email sequences and objection handling",
    steps: ["Analiză ICP", "Generare outreach", "Email sequences", "Hook-uri LinkedIn", "Obiecții & răspunsuri"],
  },
  {
    id: "outreach-conversion",
    name: "Outreach Conversion System",
    tagline: "Mesaje care convertesc, nu care deranjează",
    icon: Megaphone,
    category: "acquisition",
    outputs: ["Cold Email Templates ×7", "Follow-up Sequences", "DM Scripts", "Subject Lines ×20", "CTA Variations"],
    estimatedCredits: 280,
    estimatedOutputs: 35,
    prompt: "/mms outreach-conversion — generate complete cold outreach system with emails, follow-ups, DM scripts and CTA variations",
    steps: ["Template emails", "Follow-up logic", "DM scripts", "Subject lines", "CTA-uri"],
  },
  {
    id: "content-to-leads",
    name: "Content → Lead System",
    tagline: "Conținut care aduce clienți, nu like-uri",
    icon: Target,
    category: "acquisition",
    outputs: ["Lead Magnet", "Landing Page Copy", "Email Funnel ×5", "Social Posts ×15", "Conversion Hooks"],
    estimatedCredits: 400,
    estimatedOutputs: 30,
    prompt: "/mms content-lead-system — create lead generation system with lead magnet, landing page, email funnel and social content",
    steps: ["Lead magnet design", "Landing page copy", "Email funnel", "Social content", "Conversion hooks"],
  },
  // ─── CONTENT ───
  {
    id: "authority-engine",
    name: "Authority Content Engine",
    tagline: "Devino sursa nr.1 în nișa ta",
    icon: BookOpen,
    category: "content",
    outputs: ["Pillar Article ×3", "LinkedIn Series ×10", "Newsletter Template", "Thought Leadership Posts", "Expert Frameworks"],
    estimatedCredits: 320,
    estimatedOutputs: 30,
    prompt: "/mms authority-engine — build authority content system with pillar articles, LinkedIn series, newsletters and expert frameworks",
    steps: ["Pillar articles", "LinkedIn series", "Newsletter", "Thought leadership", "Framework extraction"],
  },
  {
    id: "content-multiplication",
    name: "Content Multiplication Factory",
    tagline: "1 idee → 50+ deliverables",
    icon: Layers,
    category: "content",
    outputs: ["Articles ×5", "Social Posts ×20", "Email Drafts ×5", "Video Scripts ×3", "Infographic Briefs ×5"],
    estimatedCredits: 450,
    estimatedOutputs: 50,
    prompt: "/mms content-multiplication — multiply single content into 50+ deliverables across all formats",
    steps: ["Extracție neuroni", "Multiplicare formule", "Adaptare canale", "Generare batch", "Quality scoring"],
  },
  // ─── STRATEGY ───
  {
    id: "market-domination",
    name: "Market Domination Blueprint",
    tagline: "Strategie completă de dominare a pieței",
    icon: TrendingUp,
    category: "strategy",
    outputs: ["Market Analysis", "Competitor Map", "Positioning Strategy", "Pricing Model", "Go-to-Market Plan"],
    estimatedCredits: 500,
    estimatedOutputs: 15,
    prompt: "/mms market-domination — create complete market domination strategy with analysis, positioning, pricing and GTM plan",
    steps: ["Analiză piață", "Mapare competitori", "Poziționare", "Model pricing", "Plan GTM"],
  },
  {
    id: "launch-system",
    name: "Product Launch System",
    tagline: "De la idee la primele vânzări în 7 zile",
    icon: Zap,
    category: "strategy",
    outputs: ["Launch Timeline", "Pre-launch Emails ×5", "Sales Page Copy", "Social Campaign ×10", "PR Pitch"],
    estimatedCredits: 380,
    estimatedOutputs: 25,
    prompt: "/mms product-launch — build complete product launch system with timeline, emails, sales page, social campaign and PR pitch",
    steps: ["Timeline lansare", "Pre-launch emails", "Sales page", "Campaign social", "PR pitch"],
  },
  // ─── KNOWLEDGE ───
  {
    id: "expertise-extraction",
    name: "Expertise Extraction Engine",
    tagline: "Transformă ce știi în active digitale",
    icon: Sparkles,
    category: "knowledge",
    outputs: ["Knowledge Map", "Expert Frameworks ×10", "Pattern Library", "Decision Trees", "Methodology Docs"],
    estimatedCredits: 300,
    estimatedOutputs: 20,
    prompt: "/mms expertise-extraction — extract and structure all expertise into frameworks, patterns, decision trees and methodology",
    steps: ["Scanare conținut", "Extracție framework-uri", "Pattern library", "Decision trees", "Documentare"],
  },
  // ─── MONETIZATION ───
  {
    id: "course-builder",
    name: "Course Builder System",
    tagline: "Curs complet din expertiza ta",
    icon: BookOpen,
    category: "monetization",
    outputs: ["Course Outline", "Module Content ×5", "Quiz Questions", "Assignment Briefs", "Sales Page"],
    estimatedCredits: 420,
    estimatedOutputs: 20,
    prompt: "/mms course-builder — build complete course from expertise with modules, quizzes, assignments and sales page",
    steps: ["Structură curs", "Conținut module", "Quiz-uri", "Assignments", "Sales page"],
  },
  {
    id: "consulting-package",
    name: "Consulting Package Generator",
    tagline: "Împachetează expertiza pentru vânzare",
    icon: Target,
    category: "monetization",
    outputs: ["Service Packages ×3", "Pricing Tiers", "Proposal Template", "Case Study Framework", "Onboarding Docs"],
    estimatedCredits: 280,
    estimatedOutputs: 15,
    prompt: "/mms consulting-package — create consulting packages with pricing, proposals, case studies and onboarding",
    steps: ["Pachete servicii", "Pricing tiers", "Template propunere", "Case study", "Onboarding"],
  },
];

// ═══ Intent → MMS Mapping ═══

const INTENT_MAP: Array<{ keywords: string[]; systemIds: string[] }> = [
  { keywords: ["client", "clienți", "vânzări", "vând", "cumpere", "customers", "sales", "sell"], systemIds: ["client-acquisition", "outreach-conversion", "content-to-leads"] },
  { keywords: ["outreach", "email", "cold", "prospect", "lead"], systemIds: ["outreach-conversion", "client-acquisition", "content-to-leads"] },
  { keywords: ["content", "conținut", "articol", "post", "scrie", "write"], systemIds: ["content-multiplication", "authority-engine", "content-to-leads"] },
  { keywords: ["autoritate", "authority", "expert", "thought leader", "recunoaștere"], systemIds: ["authority-engine", "content-multiplication", "expertise-extraction"] },
  { keywords: ["strategi", "piață", "market", "competit", "domin", "pozițion"], systemIds: ["market-domination", "launch-system", "client-acquisition"] },
  { keywords: ["lansar", "launch", "produs", "product"], systemIds: ["launch-system", "market-domination", "content-multiplication"] },
  { keywords: ["curs", "course", "educa", "predau", "teach", "learn"], systemIds: ["course-builder", "expertise-extraction", "authority-engine"] },
  { keywords: ["monetiz", "venituri", "revenue", "bani", "money", "profit"], systemIds: ["consulting-package", "course-builder", "market-domination"] },
  { keywords: ["consult", "servicii", "package", "propuner", "proposal"], systemIds: ["consulting-package", "course-builder", "client-acquisition"] },
  { keywords: ["extrag", "extract", "neuron", "framework", "pattern", "cunoștin", "knowledge"], systemIds: ["expertise-extraction", "content-multiplication", "authority-engine"] },
  { keywords: ["multiplicar", "multiply", "fabr", "factory", "masiv", "bulk", "50"], systemIds: ["content-multiplication", "authority-engine", "launch-system"] },
  { keywords: ["funnel", "conversie", "conversion", "pipeline"], systemIds: ["content-to-leads", "client-acquisition", "outreach-conversion"] },
];

export function matchIntentToSystems(input: string): MMSystem[] {
  if (!input || input.length < 2) return [];
  const lower = input.toLowerCase();

  // Score each system
  const scores = new Map<string, number>();
  for (const mapping of INTENT_MAP) {
    const matchCount = mapping.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount > 0) {
      mapping.systemIds.forEach((id, idx) => {
        const current = scores.get(id) || 0;
        scores.set(id, current + matchCount * (3 - idx)); // Position weight
      });
    }
  }

  // Sort by score, return top 3
  const ranked = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => MMS_REGISTRY.find(s => s.id === id)!)
    .filter(Boolean);

  return ranked;
}

// ═══ Quick Intent Chips (idle state) ═══

const INTENT_CHIPS = [
  { label: "Vreau clienți", icon: Users, prompt: "vreau clienți" },
  { label: "Vreau conținut", icon: BookOpen, prompt: "vreau conținut" },
  { label: "Vreau strategie", icon: TrendingUp, prompt: "vreau strategie" },
  { label: "Vreau un curs", icon: Layers, prompt: "vreau un curs" },
  { label: "Vreau autoritate", icon: Sparkles, prompt: "vreau autoritate" },
  { label: "Vreau venituri", icon: Target, prompt: "vreau venituri" },
];

interface IntentChipsProps {
  onSelect: (prompt: string) => void;
}

export function IntentChips({ onSelect }: IntentChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="w-full"
    >
      <div className="flex items-center gap-2 mb-4 px-1">
        <Target className="h-3.5 w-3.5 text-[hsl(var(--gold-oxide)/0.5)]" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold">Ce vrei să obții?</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {INTENT_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => { trackInternalEvent({ event: AnalyticsEvents.INTENT_CHIP_CLICKED, params: { label: chip.label, prompt: chip.prompt } }); onSelect(chip.prompt); }}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-[13px] font-medium",
              "border border-border/40 bg-card/60 backdrop-blur-sm",
              "hover:border-[hsl(var(--gold-oxide)/0.35)] hover:bg-[hsl(var(--gold-oxide)/0.04)] hover:text-foreground hover:shadow-sm hover:shadow-[hsl(var(--gold-oxide)/0.05)]",
              "transition-all duration-200 group"
            )}
          >
            <chip.icon className="h-4 w-4 text-muted-foreground/40 group-hover:text-[hsl(var(--gold-oxide))] transition-colors shrink-0" />
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ═══ System Recommendation Cards ═══

interface SystemRecommendationsProps {
  systems: MMSystem[];
  onSelect: (system: MMSystem) => void;
  input: string;
}

export function SystemRecommendations({ systems, onSelect, input }: SystemRecommendationsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (systems.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
          <span className="text-xs text-muted-foreground/60 font-medium">
            Sisteme recomandate pentru „{input}"
          </span>
        </div>

        <div className="space-y-2">
          {systems.map((sys, i) => (
            <motion.div
              key={sys.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <button
                onClick={() => setExpanded(expanded === sys.id ? null : sys.id)}
                className={cn(
                  "w-full text-left rounded-xl border transition-all duration-200",
                  "bg-card/60 backdrop-blur-sm",
                  expanded === sys.id
                    ? "border-primary/30 shadow-md shadow-primary/5"
                    : "border-border/40 hover:border-primary/20"
                )}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    expanded === sys.id ? "bg-primary/15" : "bg-primary/8"
                  )}>
                    <sys.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{sys.name}</h3>
                      {i === 0 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          Best match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{sys.tagline}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-mono font-semibold text-primary">{sys.estimatedCredits}N</p>
                      <p className="text-[10px] text-muted-foreground">{sys.estimatedOutputs} outputs</p>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      expanded === sys.id && "rotate-90"
                    )} />
                  </div>
                </div>

                {/* Expanded: preview outputs + steps */}
                <AnimatePresence>
                  {expanded === sys.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-1 border-t border-border/20">
                        {/* Steps */}
                        <div className="flex items-center gap-1 mb-2 overflow-x-auto scrollbar-none">
                          {sys.steps.map((step, si) => (
                            <span key={si} className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                              {si > 0 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30" />}
                              <span className="bg-muted/50 px-2 py-0.5 rounded-full">{step}</span>
                            </span>
                          ))}
                        </div>

                        {/* Output preview */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                          {sys.outputs.slice(0, 6).map((out, oi) => (
                            <div key={oi} className="flex items-center gap-1.5 text-[11px] text-foreground/80">
                              <CheckCircle2 className="h-3 w-3 text-primary/50 shrink-0" />
                              <span className="truncate">{out}</span>
                            </div>
                          ))}
                        </div>

                        {/* Execute CTA */}
                        <button
                          onClick={(e) => { e.stopPropagation(); trackInternalEvent({ event: AnalyticsEvents.MMS_SELECTED, params: { system_id: sys.id, system_name: sys.name, credits: sys.estimatedCredits } }); onSelect(sys); }}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                            "bg-primary text-primary-foreground font-semibold text-sm",
                            "hover:bg-primary/90 transition-colors"
                          )}
                        >
                          <Zap className="h-4 w-4" />
                          Lansează {sys.name}
                          <span className="text-xs opacity-75">({sys.estimatedCredits}N)</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
