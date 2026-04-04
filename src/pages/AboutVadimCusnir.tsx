/**
 * About Page — /about
 * Public page showcasing Vadim Cușnir's profile, expertise, and philosophy.
 */
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain, Zap, Users, Award, Mic, BookOpen, Target,
  Sparkles, ExternalLink, Youtube, Instagram, Facebook,
  MessageCircle,
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
  return (
    <h2 className="text-lg font-bold tracking-tight text-foreground">{children}</h2>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border/20 bg-muted/10 p-4 text-center space-y-1">
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-dense text-muted-foreground/60 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function SpiralPhase({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{number}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-compact text-muted-foreground/70">{desc}</p>
      </div>
    </div>
  );
}

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/vadim.kusnir", stat: "55K" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@vadimcusnir", stat: "44K+" },
  { icon: MessageCircle, label: "Threads", href: "https://threads.net/@vadim.kusnir", stat: "9.5K" },
  { icon: Facebook, label: "Facebook", href: "https://facebook.com/kusnir.vadim", stat: "4.3K" },
];

export default function About() {
  const { t } = useTranslation("pages");

  return (
    <PageTransition>
      <SEOHead
        title={t("about.seo_title")}
        description={t("about.seo_desc")}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">

        {/* HERO */}
        <motion.div {...fade(0)} className="text-center space-y-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 flex items-center justify-center mx-auto">
            <Brain className="h-10 w-10 text-primary/70" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("about.hero_title")}</h1>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto leading-relaxed">
              {t("about.hero_subtitle")}
            </p>
          </div>
          <p className="text-xs italic text-muted-foreground/40">
            "{t("about.hero_motto")}"
          </p>
        </motion.div>

        {/* STATS */}
        <motion.div {...fade(0.05)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard value="10+" label={t("about.stat_years")} />
            <StatCard value="36K+" label={t("about.stat_community")} />
            <StatCard value="500+" label={t("about.stat_consulted")} />
            <StatCard value="4.9/5" label={t("about.stat_reviews")} />
          </div>
        </motion.div>

        {/* INTRO */}
        <motion.div {...fade(0.1)}>
          <Section>
            <SectionTitle>{t("about.intro_title")}</SectionTitle>
            <div className="text-compact leading-[1.85] text-muted-foreground/70 space-y-3">
              <p>{t("about.intro_p1")}</p>
              <p>{t("about.intro_p2")}</p>
              <p>{t("about.intro_p3")}</p>
            </div>
          </Section>
        </motion.div>

        {/* ACHIEVEMENTS */}
        <motion.div {...fade(0.15)}>
          <Section>
            <SectionTitle>{t("about.achievements_title")}</SectionTitle>
            <div className="grid gap-2.5">
              {[
                { icon: Users, text: t("about.ach_community") },
                { icon: Mic, text: t("about.ach_podcast") },
                { icon: Award, text: t("about.ach_awards") },
                { icon: BookOpen, text: t("about.ach_academy") },
                { icon: Target, text: t("about.ach_speaker") },
                { icon: Sparkles, text: t("about.ach_ai") },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3 p-3 rounded-lg border border-border/10 hover:border-border/25 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-muted/20 flex items-center justify-center shrink-0">
                    <item.icon className="h-3.5 w-3.5 text-primary/60" />
                  </div>
                  <p className="text-compact text-muted-foreground/80">{item.text}</p>
                </div>
              ))}
            </div>
          </Section>
        </motion.div>

        {/* METODA CUȘNIR — SPIRALA */}
        <motion.div {...fade(0.2)}>
          <Section>
            <div className="space-y-1">
              <p className="text-micro font-semibold uppercase tracking-[0.2em] text-primary/50">
                {t("about.method_label")}
              </p>
              <SectionTitle>{t("about.method_title")}</SectionTitle>
              <p className="text-xs italic text-muted-foreground/50">{t("about.method_slogan")}</p>
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-5 space-y-4">
              <SpiralPhase number={1} title={t("about.spiral_1_title")} desc={t("about.spiral_1_desc")} />
              <SpiralPhase number={2} title={t("about.spiral_2_title")} desc={t("about.spiral_2_desc")} />
              <SpiralPhase number={3} title={t("about.spiral_3_title")} desc={t("about.spiral_3_desc")} />
              <SpiralPhase number={4} title={t("about.spiral_4_title")} desc={t("about.spiral_4_desc")} />
            </div>
            <div className="text-compact text-muted-foreground/70 space-y-2 pt-1">
              <p className="font-medium text-foreground/80">{t("about.method_principle_title")}</p>
              <ul className="space-y-1 pl-1">
                <li className="flex items-center gap-2"><Zap className="h-3 w-3 text-primary/40" />{t("about.method_p1")}</li>
                <li className="flex items-center gap-2"><Zap className="h-3 w-3 text-primary/40" />{t("about.method_p2")}</li>
                <li className="flex items-center gap-2"><Zap className="h-3 w-3 text-primary/40" />{t("about.method_p3")}</li>
              </ul>
            </div>
          </Section>
        </motion.div>

        {/* EXPERTISE */}
        <motion.div {...fade(0.25)}>
          <Section>
            <SectionTitle>{t("about.expertise_title")}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                t("about.exp_ai"),
                t("about.exp_copy"),
                t("about.exp_auto"),
                t("about.exp_community"),
                t("about.exp_psych"),
                t("about.exp_storytelling"),
              ].map((exp) => (
                <div key={exp} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/10 text-compact text-muted-foreground/80">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                  {exp}
                </div>
              ))}
            </div>
          </Section>
        </motion.div>

        {/* PHILOSOPHY */}
        <motion.div {...fade(0.3)}>
          <Section>
            <SectionTitle>{t("about.philosophy_title")}</SectionTitle>
            <div className="grid gap-3">
              {[
                { title: t("about.val_relativism"), desc: t("about.val_relativism_desc") },
                { title: t("about.val_freedom"), desc: t("about.val_freedom_desc") },
                { title: t("about.val_potential"), desc: t("about.val_potential_desc") },
              ].map((v) => (
                <div key={v.title} className="rounded-xl border border-border/15 p-4 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{v.title}</p>
                  <p className="text-compact text-muted-foreground/70">{v.desc}</p>
                </div>
              ))}
            </div>
          </Section>
        </motion.div>

        {/* SOCIAL PROOF */}
        <motion.div {...fade(0.35)}>
          <Section>
            <SectionTitle>{t("about.social_title")}</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/15 hover:border-primary/20 transition-colors group"
                >
                  <s.icon className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                  <p className="text-sm font-bold text-foreground tabular-nums">{s.stat}</p>
                  <p className="text-micro text-muted-foreground/40 uppercase tracking-wider">{s.label}</p>
                </a>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="https://about.me/vadimcusnir"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                about.me/vadimcusnir
              </a>
              <a
                href="https://md.linkedin.com/in/vadimkusnir"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                LinkedIn
              </a>
            </div>
          </Section>
        </motion.div>

        {/* CTA */}
        <motion.div {...fade(0.4)} className="text-center space-y-4 pb-8">
          <p className="text-compact text-muted-foreground/60 italic">{t("about.cta_text")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="sm" className="h-9 gap-1.5">
              <Link to="/services">
                <Sparkles className="h-3.5 w-3.5" />
                {t("about.cta_explore")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
              <Link to="/pricing">
                {t("about.cta_pricing")}
              </Link>
            </Button>
          </div>
        </motion.div>

      </div>
    </PageTransition>
  );
}
