/**
 * SuperlayerModules — Displays Cusnir_OS superlayer axes (Psychological, Social, Commercial, Infrastructure).
 * Used in /cusnir-os copy page for eligible and non-eligible users.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain, Users, TrendingUp, Layers, ChevronRight,
  Eye, Target, Megaphone, Network, Sparkles, Shield,
  Workflow, Bot, Search, Boxes,
} from "lucide-react";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-micro font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">
      {children}
    </p>
  );
}

interface AxisModule {
  name: string;
  icon: typeof Brain;
  description: string;
  capabilities: string[];
}

interface Axis {
  title: string;
  icon: typeof Brain;
  color: string;
  description: string;
  modules: AxisModule[];
}

const AXES: Axis[] = [
  {
    title: "Axa Psihologică",
    icon: Brain,
    color: "text-purple-400",
    description: "Simulează reacții, prezice comportamente, domină narativul.",
    modules: [
      {
        name: "Identity Simulation Engine",
        icon: Eye,
        description: "Simulează reacțiile audienței și generează tipare de răspuns comportamental.",
        capabilities: [
          "simulare comportamentală bazată pe profil",
          "predicții de reacție la mesaje",
          "optimizare narativă automată",
        ],
      },
      {
        name: "Behavioral Leverage Scanner",
        icon: Target,
        description: "Detectează fricțiuni și identifică trigger-e lipsă în funnel-uri.",
        capabilities: [
          "hartă de optimizare a punctelor de leverage",
          "identificare automată a barierelor de conversie",
          "mapare a trigger-ilor psihologici",
        ],
      },
      {
        name: "Narrative Domination Engine",
        icon: Megaphone,
        description: "Generează poziționare anti-piață și doctrine de brand dominante.",
        capabilities: [
          "generare narativ dominant",
          "framework de poziționare unică",
          "doctrină de brand automatizată",
        ],
      },
    ],
  },
  {
    title: "Axa Socială",
    icon: Users,
    color: "text-blue-400",
    description: "Mapează influența, generează viralitate, acumulează reputație.",
    modules: [
      {
        name: "Influence Graph Engine",
        icon: Network,
        description: "Mapează conexiuni și detectează puncte de intrare în nișe.",
        capabilities: [
          "hartă de influență per nișă",
          "identificare actori-cheie",
          "puncte de penetrare optimale",
        ],
      },
      {
        name: "Viral Structure Generator",
        icon: Sparkles,
        description: "Generează hook-uri și loop-uri de distribuție virale.",
        capabilities: [
          "structuri virale pre-fabricate",
          "loop-uri de redistribuire autonome",
          "hook-uri optimizate pentru platforme",
        ],
      },
      {
        name: "Reputation Accumulation System",
        icon: Shield,
        description: "Scorare autoritate și urmărire trust pe baza output-urilor.",
        capabilities: [
          "index de reputație în timp real",
          "urmărire încredere per canal",
          "acumulare autoritate compusă",
        ],
      },
    ],
  },
  {
    title: "Axa Comercială",
    icon: TrendingUp,
    color: "text-emerald-400",
    description: "Multiplică oferte, optimizează prețuri, generează funnel-uri complet autonome.",
    modules: [
      {
        name: "Offer Multiplication Engine",
        icon: Boxes,
        description: "Segmentează audiența și generează sisteme multi-ofertă din orice asset.",
        capabilities: [
          "multiplicare automată a ofertelor",
          "segmentare audiență granulară",
          "sisteme de upsell/downsell generate",
        ],
      },
      {
        name: "Pricing Intelligence System",
        icon: TrendingUp,
        description: "Analiză de elasticitate și validare Root2 pentru prețul optim.",
        capabilities: [
          "preț optim calculat automat",
          "analiză elasticitate cerere",
          "validare prin formula Root2",
        ],
      },
      {
        name: "Funnel Autogenerator",
        icon: Workflow,
        description: "Generează funnel complet: hook, headline, landing, email sequence, upsell.",
        capabilities: [
          "funnel-uri end-to-end automatizate",
          "secvențe email pre-generate",
          "pagini de landing optimizate",
        ],
      },
    ],
  },
  {
    title: "Infrastructură",
    icon: Layers,
    color: "text-amber-400",
    description: "Compilează sisteme, orchestrează agenți, detectează oportunități de arbitraj.",
    modules: [
      {
        name: "Stepback Compiler",
        icon: Layers,
        description: "Generează librării de sisteme prin analiză cauzală și compoziție OTOS → MMS → LCSS.",
        capabilities: [
          "compilare sisteme din domenii",
          "generare OTOS/MMS/LCSS automate",
          "lanțuri cauzale și puncte de control",
        ],
      },
      {
        name: "Agent Swarm Orchestrator",
        icon: Bot,
        description: "Descompune obiective, asignează agenți, execută și validează autonom.",
        capabilities: [
          "orchestrare multi-agent",
          "descompunere task-uri complexe",
          "execuție și validare autonomă",
        ],
      },
      {
        name: "Knowledge Arbitrage Engine",
        icon: Search,
        description: "Detectează gap-uri și trend-uri în Knowledge Graph pentru oportunități de arbitraj.",
        capabilities: [
          "detectare oportunități neexploatate",
          "analiză trend-uri cunoaștere",
          "arbitraj informațional automatizat",
        ],
      },
    ],
  },
];

interface SuperlayerModulesProps {
  eligible: boolean;
}

export function SuperlayerModules({ eligible }: SuperlayerModulesProps) {
  return (
    <div className="space-y-8">
      <motion.div {...fade(0)}>
        <SectionLabel>Superlayer Architecture</SectionLabel>
        <p className="text-compact text-muted-foreground/70 leading-relaxed mt-2">
          Cusnir_OS operează pe patru axe fundamentale. Fiecare axă conține module specializate
          care transformă input-ul brut în sisteme de control economic.
        </p>
      </motion.div>

      {AXES.map((axis, ai) => (
        <motion.div key={axis.title} {...fade(0.05 + ai * 0.05)}>
          <div className="rounded-xl border border-border/15 overflow-hidden">
            {/* Axis header */}
            <div className="px-4 py-3 border-b border-border/10 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center">
                <axis.icon className={cn("h-4 w-4", axis.color)} />
              </div>
              <div>
                <p className="text-compact font-semibold text-foreground">{axis.title}</p>
                <p className="text-dense text-muted-foreground/50">{axis.description}</p>
              </div>
            </div>

            {/* Modules */}
            <div className="divide-y divide-border/10">
              {axis.modules.map((mod) => (
                <div key={mod.name} className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <mod.icon className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <p className="text-xs font-semibold text-foreground/80">{mod.name}</p>
                    {!eligible && (
                      <span className="text-nano uppercase tracking-wider text-muted-foreground/30 ml-auto">
                        locked
                      </span>
                    )}
                  </div>
                  <p className="text-dense text-muted-foreground/50 leading-relaxed">{mod.description}</p>
                  {eligible && (
                    <ul className="space-y-1 pl-1">
                      {mod.capabilities.map((cap) => (
                        <li key={cap} className="flex items-start gap-2 text-dense text-muted-foreground/60">
                          <ChevronRight className="h-2.5 w-2.5 mt-0.5 text-primary/30 shrink-0" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
