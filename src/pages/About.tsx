/**
 * About AI-IDEI — /about
 * Public page about the AI-IDEI platform, its mission, architecture, and capabilities.
 */
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain, Zap, Layers, Target, Sparkles, Shield,
  BookOpen, Cpu, Network, BarChart3, Globe, Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-5", className)}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold tracking-tight text-foreground">{children}</h2>;
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border/15 p-4 space-y-2 hover:border-border/30 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary/70" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-compact text-muted-foreground/70 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function About() {
  const { t } = useTranslation("pages");

  return (
    <PageTransition>
      <SEOHead
        title={t("about_platform.seo_title")}
        description={t("about_platform.seo_desc")}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">

        {/* HERO */}
        <motion.div {...fade(0)} className="text-center space-y-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 flex items-center justify-center mx-auto">
            <Layers className="h-10 w-10 text-primary/70" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              AI-<span className="text-primary">IDEI</span>
            </h1>
            <p className="text-sm text-muted-foreground/70 max-w-lg mx-auto leading-relaxed">
              {t("about_platform.hero_subtitle")}
            </p>
          </div>
        </motion.div>

        {/* WHAT IS AI-IDEI */}
        <motion.div {...fade(0.05)}>
          <Section>
            <SectionTitle>{t("about_platform.what_title")}</SectionTitle>
            <div className="text-compact leading-[1.85] text-muted-foreground/70 space-y-3">
              <p>{t("about_platform.what_p1")}</p>
              <p>{t("about_platform.what_p2")}</p>
              <p>{t("about_platform.what_p3")}</p>
            </div>
          </Section>
        </motion.div>

        {/* CORE FLOW */}
        <motion.div {...fade(0.1)}>
          <Section>
            <SectionTitle>{t("about_platform.flow_title")}</SectionTitle>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              {[
                { icon: BookOpen, label: t("about_platform.flow_1") },
                { icon: Brain, label: t("about_platform.flow_2") },
                { icon: Cpu, label: t("about_platform.flow_3") },
                { icon: Sparkles, label: t("about_platform.flow_4") },
              ].map((step, i) => (
                <div key={step.label} className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-border/15 text-center">
                  <step.icon className="h-5 w-5 text-primary/60" />
                  <p className="text-xs font-semibold text-foreground">{step.label}</p>
                  {i < 3 && <span className="hidden sm:block text-muted-foreground/30 text-lg absolute right-0">→</span>}
                </div>
              ))}
            </div>
          </Section>
        </motion.div>

        {/* CAPABILITIES */}
        <motion.div {...fade(0.15)}>
          <Section>
            <SectionTitle>{t("about_platform.cap_title")}</SectionTitle>
            <div className="grid gap-3">
              <FeatureCard icon={Brain} title={t("about_platform.cap_neurons_title")} desc={t("about_platform.cap_neurons_desc")} />
              <FeatureCard icon={Zap} title={t("about_platform.cap_services_title")} desc={t("about_platform.cap_services_desc")} />
              <FeatureCard icon={Network} title={t("about_platform.cap_graph_title")} desc={t("about_platform.cap_graph_desc")} />
              <FeatureCard icon={BarChart3} title={t("about_platform.cap_intelligence_title")} desc={t("about_platform.cap_intelligence_desc")} />
              <FeatureCard icon={Workflow} title={t("about_platform.cap_automation_title")} desc={t("about_platform.cap_automation_desc")} />
              <FeatureCard icon={Globe} title={t("about_platform.cap_marketplace_title")} desc={t("about_platform.cap_marketplace_desc")} />
            </div>
          </Section>
        </motion.div>

        {/* ARCHITECTURE */}
        <motion.div {...fade(0.2)}>
          <Section>
            <SectionTitle>{t("about_platform.arch_title")}</SectionTitle>
            <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t("about_platform.arch_frontend"), value: "React + TypeScript" },
                  { label: t("about_platform.arch_backend"), value: "Lovable Cloud" },
                  { label: t("about_platform.arch_ai"), value: "Multi-Model AI" },
                  { label: t("about_platform.arch_i18n"), value: "EN · RO · RU" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-lg border border-border/10">
                    <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </motion.div>

        {/* SECURITY */}
        <motion.div {...fade(0.25)}>
          <Section>
            <SectionTitle>{t("about_platform.security_title")}</SectionTitle>
            <div className="flex items-start gap-3 rounded-xl border border-border/15 p-4">
              <Shield className="h-5 w-5 text-primary/60 shrink-0 mt-0.5" />
              <div className="text-compact text-muted-foreground/70 space-y-2">
                <p>{t("about_platform.security_p1")}</p>
                <p>{t("about_platform.security_p2")}</p>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* WHO IT'S FOR */}
        <motion.div {...fade(0.3)}>
          <Section>
            <SectionTitle>{t("about_platform.audience_title")}</SectionTitle>
            <div className="grid gap-2.5">
              {[
                t("about_platform.audience_1"),
                t("about_platform.audience_2"),
                t("about_platform.audience_3"),
                t("about_platform.audience_4"),
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 p-3 rounded-lg border border-border/10">
                  <Target className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                  <p className="text-compact text-muted-foreground/80">{item}</p>
                </div>
              ))}
            </div>
          </Section>
        </motion.div>

        {/* CTA */}
        <motion.div {...fade(0.35)} className="text-center space-y-4 pb-8">
          <p className="text-compact text-muted-foreground/60 italic">{t("about_platform.cta_text")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="sm" className="h-9 gap-1.5">
              <Link to="/services">
                <Sparkles className="h-3.5 w-3.5" />
                {t("about_platform.cta_start")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
              <Link to="/about-vadim-cusnir">
                {t("about_platform.cta_founder")}
              </Link>
            </Button>
          </div>
        </motion.div>

      </div>
    </PageTransition>
  );
}
