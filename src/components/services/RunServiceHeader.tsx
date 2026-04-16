import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/premium/PremiumPaywall";
import {
  ArrowLeft, CheckCircle2, Clock, Coins,
  Sparkles, FileText, BarChart3, Brain, Target, Layers, Zap,
} from "lucide-react";
import type { Service } from "@/hooks/useRunService";

const CATEGORY_ICON: Record<string, React.ElementType> = {
  extraction: Brain, analysis: BarChart3, content: FileText,
  strategy: Target, production: Layers, orchestration: Zap, document: FileText,
};

interface Props {
  service: Service;
  deliverables: any[];
  onBack: () => void;
  t: (key: string, opts?: any) => string;
}

export function RunServiceHeader({ service, deliverables, onBack, t }: Props) {
  const CatIcon = CATEGORY_ICON[service.category] || Sparkles;

  return (
    <>
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        {t("run_service.all_services")}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <CatIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl sm:text-2xl font-medium">{service.name}</h1>
              <Badge variant="secondary" className="text-nano font-mono uppercase">{service.category}</Badge>
              <TierBadge tier={service.access_tier} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-ai-accent" />
            <span className="font-bold font-mono">{service.credits_cost}</span>
            <span className="text-xs text-muted-foreground">NEURONS</span>
          </div>
          {deliverables.length > 0 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-status-validated" />
              <span className="text-xs text-muted-foreground">{t("run_service.deliverables_count", { count: deliverables.length })}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">{t("run_service.duration_estimate")}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
