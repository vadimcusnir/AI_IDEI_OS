/**
 * HomeQuickActions — Quick action cards for the Home dashboard.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Upload, Plus, Sparkles, Briefcase, Youtube, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ControlledSection } from "@/components/ControlledSection";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export function HomeQuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");

  const QUICK_ACTIONS = [
    {
      label: t("home.quick_actions.transcribe"),
      desc: t("home.quick_actions.transcribe_desc"),
      icon: Youtube,
      path: "/transcribe",
      gradient: "from-destructive/15 to-destructive/5",
    },
    {
      label: t("home.quick_actions.upload"),
      desc: t("home.quick_actions.upload_desc"),
      icon: Upload,
      path: "/extractor",
      gradient: "from-primary/15 to-primary/5",
    },
    {
      label: t("home.quick_actions.new_neuron"),
      desc: t("home.quick_actions.new_neuron_desc"),
      icon: Plus,
      path: "/n/new",
      gradient: "from-primary/10 to-accent/5",
    },
    {
      label: t("home.quick_actions.run_service"),
      desc: t("home.quick_actions.run_service_desc"),
      icon: Sparkles,
      path: "/services",
      gradient: "from-accent/15 to-primary/5",
    },
    {
      label: t("home.quick_actions.view_jobs"),
      desc: t("home.quick_actions.view_jobs_desc"),
      icon: Briefcase,
      path: "/jobs",
      gradient: "from-muted to-card",
    },
  ];

  return (
    <ControlledSection elementId="home.quick_actions">
      <motion.section variants={stagger} initial="hidden" animate="visible">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t("home.quick_actions_title", "Quick Actions")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(action => (
            <motion.button
              key={action.label}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(action.path)}
              data-tour={action.path === "/extractor" ? "upload" : action.path === "/neurons" ? "neurons" : action.path === "/services" ? "services" : undefined}
              className={cn(
                "group relative flex flex-col items-start gap-3 p-4 rounded-xl border border-border",
                "bg-gradient-to-br hover:border-primary/30 hover:shadow-lg transition-all duration-200",
                action.gradient
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-background/80 border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-sm transition-all">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight mb-0.5">{action.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{action.desc}</p>
              </div>
              <ArrowRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </motion.button>
          ))}
        </div>
      </motion.section>
    </ControlledSection>
  );
}
