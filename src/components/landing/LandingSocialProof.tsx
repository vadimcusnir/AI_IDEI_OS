import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";

export function LandingSocialProof() {
  const { t } = useTranslation("landing");
  const testimonials = t("social_proof.testimonials", { returnObjects: true }) as Array<{ text: string; name: string; role: string }>;

  return (
    <section className="py-28 sm:py-40" aria-label="Testimonials">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16 sm:mb-24">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-6 block">{t("social_proof.label")}</span>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-[-0.01em] text-foreground leading-[1.15]">{t("social_proof.title")}</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((item, i) => (
            <FadeInView key={i} delay={i * 0.08} className="relative p-8 sm:p-10 rounded-xl border border-border/50 bg-card landing-card">
              <span className="absolute top-5 left-7 text-5xl text-[hsl(var(--gold-oxide)/0.15)] leading-none select-none font-serif">&ldquo;</span>
              <blockquote className="text-sm text-foreground leading-[1.75] mb-7 pt-8 italic">
                {item.text}
              </blockquote>
              <div className="border-t border-border/30 pt-5 flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-mono font-bold text-[hsl(var(--gold-oxide))]">{item.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{item.name}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.role}</p>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
