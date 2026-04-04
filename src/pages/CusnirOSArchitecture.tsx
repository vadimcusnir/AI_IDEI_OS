/**
 * CusnirOSArchitecture — Full superlayer specification page.
 * Only accessible to eligible Cusnir_OS users.
 */
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useCusnirOS } from "@/hooks/useCusnirOS";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, ArrowLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const fade = (d: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: d },
});

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-micro font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">
      {children}
    </p>
  );
}

interface SpecBlock {
  id: string;
  title: string;
  description: string;
  items: string[];
}

const PIPELINE: SpecBlock = {
  id: "pipeline",
  title: "Core Pipeline",
  description: "Input → Transformation → Output. Fiecare execuție traversează acest flux.",
  items: [
    "Extract — extracție semantică din conținut brut",
    "Structure — organizare în unități de cunoaștere",
    "Generate — producere de active economice",
    "Orchestrate — coordonare multi-agent",
    "Monetize — conversie în venituri",
    "Optimize — îmbunătățire continuă prin feedback loop",
  ],
};

const LAYERS: SpecBlock[] = [
  {
    id: "psychological",
    title: "Axa Psihologică",
    description: "Simulare identitate, scanner leverage comportamental, motor narativ dominant.",
    items: [
      "Identity Simulation Engine — simulare reacții audiență, predicții comportamentale",
      "Behavioral Leverage Scanner — detectare fricțiuni, identificare trigger-e lipsă",
      "Narrative Domination Engine — poziționare anti-piață, generare doctrină de brand",
    ],
  },
  {
    id: "social",
    title: "Axa Socială",
    description: "Mapare influență, structuri virale, acumulare reputație.",
    items: [
      "Influence Graph Engine — hartă de influență, puncte de penetrare în nișe",
      "Viral Structure Generator — hook-uri, loop-uri de distribuție autonome",
      "Reputation Accumulation System — scoring autoritate, tracking trust",
    ],
  },
  {
    id: "commercial",
    title: "Axa Comercială",
    description: "Multiplicare oferte, pricing inteligent, funnel-uri autogenerate.",
    items: [
      "Offer Multiplication Engine — segmentare audiență, sisteme multi-ofertă",
      "Pricing Intelligence System — elasticitate, validare Root2, preț optim",
      "Funnel Autogenerator — hook → headline → landing → email → upsell",
      "Revenue Graph Engine — mapare flux valoare, vizualizare revenue",
    ],
  },
  {
    id: "infrastructure",
    title: "Infrastructură",
    description: "Compilare sisteme, orchestrare agenți, arbitraj cunoaștere.",
    items: [
      "Stepback Compiler — analiză cauzală, generare OTOS/MMS/LCSS",
      "Agent Swarm Orchestrator — descompunere, asignare, execuție, validare",
      "Knowledge Arbitrage Engine — detectare gap-uri, oportunități neexploatate",
      "Asset Compounding System — multiplicare output-uri, distribuție, monetizare",
    ],
  },
  {
    id: "economy",
    title: "Game + Economy Layer",
    description: "Deblocare capabilități, marketplace intern, intelligence feed privat.",
    items: [
      "Power Unlock System — XP, usage → deblocare capabilități noi",
      "Internal Marketplace — listare, tranzacționare, captare comisioane",
      "Private Intelligence Feed — filtrare date high-value, insights exclusive",
    ],
  },
  {
    id: "memory",
    title: "Memory + Learning",
    description: "Persistență comportamentală, ajustare sistemică.",
    items: [
      "Stocare comportament utilizator",
      "Tipare de succes și eșec",
      "Feedback loop → ajustare decizii automate",
    ],
  },
];

const ACCESS_TIERS = [
  {
    tier: "VIP",
    requirements: ["11 luni subscripție consecutivă", "NOTA2 threshold menținut"],
    capabilities: ["Acces parțial la module", "Vizibilitate pipeline"],
  },
  {
    tier: "Cusnir_OS",
    requirements: ["Statut VIP activ", "Override payment opțional: $9,992"],
    capabilities: ["Control total sistem", "Acces complet module", "Orchestrare agenți"],
  },
];

const SCORING = [
  "Accuracy — precizia output-urilor generate",
  "Utility — utilitatea practică a rezultatelor",
  "Economic Impact — impactul economic măsurabil",
  "Formula: weighted_sum(metrics) → dacă scor < threshold → reject → altfel → deploy",
];

const AUTOMATION = [
  "Generate → Score → Filter → Deploy → Learn",
  "Persistență: stocare toate output-urile, actualizare modele",
  "Validare: zero duplicare, output-uri atomice, monetizare definită",
];

export default function CusnirOSArchitecture() {
  const { user, loading: authLoading } = useAuth();
  const { eligible, loading: cusnirLoading } = useCusnirOS();
  const navigate = useNavigate();

  const loading = authLoading || cusnirLoading;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  if (!user || !eligible) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <Lock className="h-8 w-8 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">Acces restricționat — necesită eligibilitate Cusnir_OS.</p>
        <Button size="sm" variant="outline" onClick={() => navigate("/cusnir-os")}>
          <ArrowLeft className="h-3 w-3 mr-1.5" /> Înapoi
        </Button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead
          title="Cusnir_OS — Architecture Specification"
          description="Complete superlayer architecture documentation for system operators."
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
          {/* Nav */}
          <motion.div {...fade(0)}>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground/50">
              <Link to="/cusnir-os"><ArrowLeft className="h-3 w-3 mr-1" /> Cusnir_OS</Link>
            </Button>
          </motion.div>

          {/* Hero */}
          <motion.div {...fade(0.02)} className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Superlayer Architecture v1.0</h1>
            <p className="text-compact text-muted-foreground/60 leading-relaxed">
              Specificație completă a sistemului de control. Fiecare modul documentat,
              fiecare flux definit, fiecare ieșire validată.
            </p>
          </motion.div>

          {/* System Definition */}
          <motion.div {...fade(0.04)} className="space-y-3">
            <Label>System Definition</Label>
            <div className="rounded-xl border border-border/15 p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">Role: Control Plane + Economic Engine + Agent Orchestrator</p>
              <p className="text-dense text-muted-foreground/60 leading-relaxed">
                Transformă utilizatori → operatori. Transformă conținut → sisteme. Transformă sisteme → loop-uri de venit.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Agent Layer", "Service Engine", "Knowledge Graph", "Economy Engine"].map(l => (
                  <span key={l} className="text-nano px-2 py-0.5 rounded-full border border-border/20 text-muted-foreground/50">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Pipeline */}
          <motion.div {...fade(0.06)} className="space-y-3">
            <Label>{PIPELINE.title}</Label>
            <p className="text-dense text-muted-foreground/50">{PIPELINE.description}</p>
            <div className="rounded-xl border border-border/15 p-4">
              <ul className="space-y-1.5">
                {PIPELINE.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-dense text-muted-foreground/70">
                    <ChevronRight className="h-2.5 w-2.5 mt-0.5 text-primary/30 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Layers */}
          {LAYERS.map((layer, i) => (
            <motion.div key={layer.id} {...fade(0.08 + i * 0.03)} className="space-y-3">
              <Label>{layer.title}</Label>
              <p className="text-dense text-muted-foreground/50">{layer.description}</p>
              <div className="rounded-xl border border-border/15 p-4">
                <ul className="space-y-1.5">
                  {layer.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-dense text-muted-foreground/70">
                      <ChevronRight className="h-2.5 w-2.5 mt-0.5 text-primary/30 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}

          {/* Access Control */}
          <motion.div {...fade(0.3)} className="space-y-3">
            <Label>Access Control</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACCESS_TIERS.map(t => (
                <div key={t.tier} className={cn(
                  "rounded-xl border p-4 space-y-2",
                  t.tier === "Cusnir_OS" ? "border-primary/15 bg-primary/[0.02]" : "border-border/15"
                )}>
                  <p className="text-xs font-semibold text-foreground">{t.tier}</p>
                  <div className="space-y-1">
                    <p className="text-micro uppercase tracking-wider text-muted-foreground/40">Cerințe</p>
                    {t.requirements.map(r => (
                      <p key={r} className="text-dense text-muted-foreground/60">• {r}</p>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-micro uppercase tracking-wider text-muted-foreground/40">Capabilități</p>
                    {t.capabilities.map(c => (
                      <p key={c} className="text-dense text-muted-foreground/60">• {c}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Scoring */}
          <motion.div {...fade(0.33)} className="space-y-3">
            <Label>Scoring Engine</Label>
            <div className="rounded-xl border border-border/15 p-4">
              <ul className="space-y-1.5">
                {SCORING.map(s => (
                  <li key={s} className="flex items-start gap-2 text-dense text-muted-foreground/70">
                    <ChevronRight className="h-2.5 w-2.5 mt-0.5 text-primary/30 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Automation */}
          <motion.div {...fade(0.36)} className="space-y-3">
            <Label>Automation Loop</Label>
            <div className="rounded-xl border border-border/15 p-4">
              <ul className="space-y-1.5">
                {AUTOMATION.map(a => (
                  <li key={a} className="flex items-start gap-2 text-dense text-muted-foreground/70">
                    <ChevronRight className="h-2.5 w-2.5 mt-0.5 text-primary/30 shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Verdict */}
          <motion.div {...fade(0.39)} className="rounded-xl border border-primary/15 bg-primary/[0.02] p-5 space-y-3 text-center">
            <p className="text-compact font-semibold text-foreground">Verdict</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              Cusnir_OS devine un sistem de control total asupra producției, distribuției și monetizării.
            </p>
            <p className="text-dense text-foreground/80 font-medium">
              User → Executor → System Operator
            </p>
            <p className="text-dense italic text-muted-foreground/40">
              Infrastructură autonomă de generare și scalare economică.
            </p>
          </motion.div>

          {/* Nav links */}
          <motion.div {...fade(0.42)} className="flex flex-wrap gap-2 pb-8">
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link to="/cusnir-os/map">System Map</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link to="/cusnir-os">Overview</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
