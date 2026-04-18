import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import { useNavigate } from "react-router-dom";
import { Upload, Sparkles, Send, ArrowRight, Mic, FileText, Linkedin, Mail } from "lucide-react";

export function LandingMechanism() {
  const { t } = useTranslation("landing");
  const navigate = useNavigate();
  const step2Items = t("mechanism_example.step2_items", { returnObjects: true }) as string[];
  const step3Items = t("mechanism_example.step3_items", { returnObjects: true }) as string[];

  return (
    <section id="mechanism" className="py-24 sm:py-32 border-y border-border/50" aria-labelledby="mechanism-heading">
      <ContentBoundary width="default">
        <FadeInView className="text-center mb-16 sm:mb-20">
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

        {/* 3-step concrete example */}
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
                <div className="text-center space-y-2">
                  <Mic className="h-8 w-8 text-gold/70 mx-auto" />
                  <p className="text-sm font-mono text-foreground">
                    {t("mechanism_example.step1_input")}
                  </p>
                  <p className="text-xs text-muted-foreground">2:34 · 1.8 MB</p>
                </div>
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
              <ul className="space-y-2.5 flex-1">
                {step2Items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                    <span className="font-mono text-xs">{item}</span>
                  </li>
                ))}
              </ul>
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
              <ul className="space-y-2.5 flex-1">
                {step3Items.map((item, idx) => {
                  const Icon = [Linkedin, Mail, FileText, Send][idx] || FileText;
                  return (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                      <Icon className="h-3.5 w-3.5 text-gold/70 shrink-0" />
                      <span>{item}</span>
                    </li>
                  );
                })}
              </ul>
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
