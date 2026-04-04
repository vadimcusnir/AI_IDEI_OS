import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

export function LandingSocialProof() {
  const { t } = useTranslation("landing");
  const testimonials = t("social_proof.testimonials", { returnObjects: true }) as Array<{ text: string; name: string; role: string }>;

  return (
    <section className="py-32 sm:py-44" aria-label="Testimonials">
      <ContentBoundary width="default">
        <FadeInView className="text-center mb-20 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">{t("social_proof.label")}</span>
          <h2 className="text-h2 text-foreground">{t("social_proof.title")}</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <FadeInView key={i} delay={i * 0.1} className="relative p-6 sm:p-8 rounded-xl border border-border/50 bg-card landing-card group">
              <span className="absolute top-4 left-6 text-5xl text-gold/12 leading-none select-none font-serif group-hover:text-gold/20 transition-colors duration-300">&ldquo;</span>
              <blockquote className="text-caption text-foreground leading-relaxed mb-6 pt-8 italic">
                {item.text}
              </blockquote>
              <div className="border-t border-border/30 pt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gold/[0.08] flex items-center justify-center shrink-0 group-hover:bg-gold/[0.14] transition-colors duration-300">
                  <span className="text-xs font-mono font-bold text-gold">{item.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-caption font-bold text-foreground">{item.name}</p>
                  <p className="text-footnote font-mono text-muted-foreground mt-0.5">{item.role}</p>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </ContentBoundary>
    </section>
  );
}
