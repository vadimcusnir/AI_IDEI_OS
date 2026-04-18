import { useState } from "react";
import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Send, ArrowRight, Mic, FileText, Link2, Linkedin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type SourceKey = "voice" | "doc" | "link";

const SOURCE_TABS: Array<{ key: SourceKey; Icon: any }> = [
  { key: "voice", Icon: Mic },
  { key: "doc", Icon: FileText },
  { key: "link", Icon: Link2 },
];

export function LandingMechanism() {
  const { t } = useTranslation("landing");
  const navigate = useNavigate();
  const [active, setActive] = useState<SourceKey>("voice");

  const variant = t(`mechanism_example.variants.${active}`, { returnObjects: true }) as {
    input_filename: string;
    input_meta: string;
    step2_items: string[];
    step3_items: string[];
  };
  const ActiveIcon = SOURCE_TABS.find((s) => s.key === active)!.Icon;

  return (
    <section id="mechanism" className="py-24 sm:py-32 border-y border-border/50" aria-labelledby="mechanism-heading">
      <ContentBoundary width="default">
        <FadeInView className="text-center mb-12 sm:mb-16">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">
            {t("mechanism.label")}
          </span>
          <h2 id="mechanism-heading" className="text-h2 text-foreground mb-4">
            {t("mechanism.title")}
          </h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {t("mechanism.subtitle")}
          </p>
        </FadeInView>

        {/* Interactive tabs — choose source type */}
        <FadeInView delay={0.05} className="mb-8">
          <div className="text-center">
            <p className="text-eyebrow font-mono tracking-[0.25em] text-muted-foreground/70 mb-4">
              {t("mechanism_example.tabs_label")}
            </p>
            <div role="tablist" aria-label="Source type" className="inline-flex items-center gap-1 p-1 rounded-full border border-border/50 bg-card/60 backdrop-blur">
              {SOURCE_TABS.map(({ key, Icon }) => {
                const isActive = active === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(key)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-mono tracking-[0.08em] transition-all focus-ring",
                      isActive
                        ? "bg-gold text-obsidian shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t(`mechanism_example.tabs.${key}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </FadeInView>

        {/* 3-step concrete example — reactive to active tab */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {/* STEP 1 — Upload */}
          <FadeInView delay={0.05}>
            <div className="rounded-xl border border-border/50 bg-card p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-mono font-bold text-gold/40">01</span>
                <Upload className="h-4 w-4 text-gold" />
                <span className="text-eyebrow font-mono tracking-[0.2em] text-muted-foreground">
                  {t("mechanism_example.step1_caption")}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center py-6 rounded-lg bg-obsidian/30 border border-dashed border-gold/20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="text-center space-y-2"
                  >
                    <ActiveIcon className="h-8 w-8 text-gold/70 mx-auto" />
                    <p className="text-sm font-mono text-foreground break-all px-2">
                      {variant.input_filename}
                    </p>
                    <p className="text-xs text-muted-foreground">{variant.input_meta}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </FadeInView>

          {/* STEP 2 — AI extracts */}
          <FadeInView delay={0.15}>
            <div className="rounded-xl border border-gold/30 bg-card p-6 h-full flex flex-col ring-1 ring-gold/10">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-mono font-bold text-gold/40">02</span>
                <Sparkles className="h-4 w-4 text-gold animate-pulse" />
                <span className="text-eyebrow font-mono tracking-[0.2em] text-gold">
                  {t("mechanism_example.step2_caption")}
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.ul
                  key={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5 flex-1"
                >
                  {variant.step2_items.map((item, idx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                      <span className="font-mono text-xs">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>
          </FadeInView>

          {/* STEP 3 — Publish */}
          <FadeInView delay={0.25}>
            <div className="rounded-xl border border-border/50 bg-card p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-mono font-bold text-gold/40">03</span>
                <Send className="h-4 w-4 text-gold" />
                <span className="text-eyebrow font-mono tracking-[0.2em] text-muted-foreground">
                  {t("mechanism_example.step3_caption")}
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.ul
                  key={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5 flex-1"
                >
                  {variant.step3_items.map((item, idx) => {
                    const Icon = [Linkedin, Mail, FileText, Send][idx] || FileText;
                    return (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center gap-2.5 text-sm text-foreground"
                      >
                        <Icon className="h-3.5 w-3.5 text-gold/70 shrink-0" />
                        <span>{item}</span>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </AnimatePresence>
            </div>
          </FadeInView>
        </div>

        {/* CTA in section */}
        <FadeInView delay={0.35} className="text-center">
          <button
            onClick={() => navigate("/extractor")}
            className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dim underline underline-offset-4 decoration-gold/30 hover:decoration-gold transition-colors duration-200 focus-ring rounded"
          >
            {t("mechanism_example.cta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </FadeInView>
      </ContentBoundary>
    </section>
  );
}
