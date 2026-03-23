/**
 * HomeStatsRow — KPI stat cards for the Home dashboard.
 */
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Brain, FileText, Zap, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { TopUpDialog } from "@/components/credits/TopUpDialog";
import { ControlledSection } from "@/components/ControlledSection";

interface HomeStatsRowProps {
  totalNeurons: number;
  totalEpisodes: number;
  totalJobs: number;
  balance: number;
  onDataRefresh: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

function StatCard({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType; label: string; value: number; highlight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-xl p-4 border transition-all duration-200 h-full cursor-default",
        highlight
          ? "bg-primary/5 border-primary/20 hover:shadow-md hover:shadow-primary/5"
          : "bg-card border-border hover:shadow-md hover:border-border/80"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", highlight ? "text-primary" : "text-muted-foreground")} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-xl font-bold font-mono", highlight && "text-primary")}>{value.toLocaleString()}</p>
    </motion.div>
  );
}

export function HomeStatsRow({ totalNeurons, totalEpisodes, totalJobs, balance, onDataRefresh }: HomeStatsRowProps) {
  const { t } = useTranslation("pages");

  return (
    <ControlledSection elementId="home.stats_row">
      <motion.section variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div variants={fadeUp}><StatCard icon={Brain} label={t("admin.neurons", "Neurons")} value={totalNeurons} /></motion.div>
        <motion.div variants={fadeUp}><StatCard icon={FileText} label={t("admin.episodes", "Episodes")} value={totalEpisodes} /></motion.div>
        <motion.div variants={fadeUp}><StatCard icon={Zap} label={t("admin.jobs", "Jobs")} value={totalJobs} /></motion.div>
        <motion.div variants={fadeUp}>
          <div className="rounded-xl p-4 border border-primary/20 bg-primary/5 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("credits.title", "Credits")}</span>
            </div>
            <p className="text-xl font-bold font-mono text-primary mb-2">{balance.toLocaleString()}</p>
            <TopUpDialog onSuccess={onDataRefresh} />
          </div>
        </motion.div>
      </motion.section>
    </ControlledSection>
  );
}
