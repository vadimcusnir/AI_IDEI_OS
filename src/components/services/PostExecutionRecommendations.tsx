import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Package, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Recommendation {
  label: string;
  description: string;
  route?: string;
  serviceKey?: string;
  icon: React.ElementType;
  priority: "high" | "medium";
  costHint?: string;
}

interface PostExecutionRecommendationsProps {
  serviceKey: string;
  serviceCategory?: string;
  className?: string;
  lastOutput?: string;
  lastGoal?: string;
  onChainService?: (serviceKey: string, prefill: { input: string; goal: string }) => void;
}

const SERVICE_CATEGORY_MAP: Record<string, string> = {
  "marketing-strategy": "strategy",
  "content-plan": "content",
  "social-media-posts": "content",
  "email-sequence": "content",
  "brand-analysis": "strategy",
  "audience-persona": "research",
  "competitive-analysis": "research",
  "seo-audit": "research",
  "pricing-strategy": "strategy",
  "sales-funnel": "strategy",
  "copywriting-formulas": "content",
  "ad-copy": "content",
  "landing-page-copy": "content",
  "video-script": "content",
  "podcast-script": "content",
  "course-outline": "education",
  "webinar-content": "education",
  "newsletter": "content",
  "case-study": "content",
  "whitepaper": "content",
  "press-release": "content",
  "product-description": "content",
};

const CHAIN_RECOMMENDATIONS: Record<string, Recommendation[]> = {
  strategy: [
    { label: "Generează conținut din strategie", description: "Transformă strategia în articole, posturi, emailuri", serviceKey: "content-plan", icon: Sparkles, priority: "high", costHint: "~290N" },
    { label: "Analiză competitivă", description: "Compară strategia ta cu piața", serviceKey: "competitive-analysis", icon: TrendingUp, priority: "high", costHint: "~440N" },
    { label: "Publică ca asset", description: "Vinde strategia pe marketplace", route: "/marketplace", icon: Package, priority: "medium" },
  ],
  content: [
    { label: "Generează variante", description: "Creează versiuni alternative optimizate", serviceKey: "social-media-posts", icon: Sparkles, priority: "high", costHint: "~290N" },
    { label: "Strategie completă", description: "Construiește o strategie din conținut", serviceKey: "marketing-strategy", icon: TrendingUp, priority: "medium", costHint: "~440N" },
    { label: "Salvează ca template", description: "Listează pe marketplace", route: "/marketplace", icon: Package, priority: "medium" },
  ],
  research: [
    { label: "Aplică în strategie", description: "Folosește insights în planificare", serviceKey: "marketing-strategy", icon: Zap, priority: "high", costHint: "~440N" },
    { label: "Generează raport complet", description: "Creează raport detaliat", serviceKey: "seo-audit", icon: Sparkles, priority: "high", costHint: "~580N" },
    { label: "Export & vinde", description: "Listează pe marketplace", route: "/marketplace", icon: Package, priority: "medium" },
  ],
  education: [
    { label: "Generează materiale", description: "Slide-uri, exerciții, quizuri", serviceKey: "course-outline", icon: Sparkles, priority: "high", costHint: "~440N" },
    { label: "Strategie de lansare", description: "Plan de monetizare & marketing", serviceKey: "marketing-strategy", icon: TrendingUp, priority: "medium", costHint: "~440N" },
    { label: "Publică ca produs", description: "Vinde pe marketplace", route: "/marketplace", icon: Package, priority: "medium" },
  ],
};

const DEFAULT_CHAIN: Recommendation[] = [
  { label: "Continuă cu un serviciu AI", description: "Folosește rezultatul ca input", serviceKey: "insight-extractor", icon: Sparkles, priority: "high", costHint: "~290N" },
  { label: "Extrage cunoștințe", description: "Transformă în neuroni reutilizabili", route: "/extractor", icon: Zap, priority: "high" },
  { label: "Explorează marketplace", description: "Templates și assets gata de folosit", route: "/marketplace", icon: Package, priority: "medium" },
];

export function PostExecutionRecommendations({
  serviceKey,
  serviceCategory,
  className,
  lastOutput,
  lastGoal,
  onChainService,
}: PostExecutionRecommendationsProps) {
  const navigate = useNavigate();

  const recommendations = useMemo(() => {
    const category = serviceCategory || SERVICE_CATEGORY_MAP[serviceKey] || "default";
    return CHAIN_RECOMMENDATIONS[category] || DEFAULT_CHAIN;
  }, [serviceKey, serviceCategory]);

  const handleClick = (rec: Recommendation) => {
    if (rec.serviceKey && onChainService && lastOutput) {
      const truncatedOutput = lastOutput.length > 4000 ? lastOutput.slice(0, 4000) + "\n\n[...truncated]" : lastOutput;
      onChainService(rec.serviceKey, {
        input: truncatedOutput,
        goal: lastGoal || `Continuare din ${serviceKey}`,
      });
    } else if (rec.route) {
      navigate(rec.route);
    } else {
      navigate("/services");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={cn("mt-6", className)}
    >
      <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
        <Zap className="h-3 w-3 text-primary" />
        Acțiuni recomandate
        {lastOutput && (
          <span className="text-primary/60 ml-1">— click pentru auto-chain</span>
        )}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {recommendations.map((rec, i) => (
          <motion.button
            key={rec.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            onClick={() => handleClick(rec)}
            className={cn(
              "group text-left p-3 rounded-xl border transition-all",
              rec.serviceKey && lastOutput && onChainService
                ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/15 ring-1 ring-primary/10"
                : rec.priority === "high"
                  ? "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10"
                  : "border-border bg-card hover:border-primary/20 hover:bg-muted/30"
            )}
          >
            <div className="flex items-start gap-2">
              <rec.icon className={cn(
                "h-4 w-4 mt-0.5 shrink-0",
                rec.serviceKey && lastOutput ? "text-primary" : rec.priority === "high" ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                  {rec.label}
                </p>
                <p className="text-micro text-muted-foreground mt-0.5 line-clamp-1">
                  {rec.description}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {rec.costHint && (
                    <span className="inline-block text-nano font-mono text-primary/70 bg-primary/10 rounded px-1 py-0.5">
                      {rec.costHint}
                    </span>
                  )}
                  {rec.serviceKey && lastOutput && onChainService && (
                    <span className="inline-block text-nano font-medium text-primary bg-primary/10 rounded px-1 py-0.5">
                      ⚡ auto-fill
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors mt-1 shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
