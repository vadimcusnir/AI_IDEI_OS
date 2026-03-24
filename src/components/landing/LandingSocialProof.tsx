import { FadeInView } from "@/components/motion/PageTransition";
import { useTranslation } from "react-i18next";

export function LandingSocialProof() {
  const { t } = useTranslation("landing");
  const testimonials = t("social_proof.testimonials", { returnObjects: true }) as Array<{ text: string; name: string; role: string }>;

  return (
    <section className="py-24 sm:py-36" aria-label="Testimonials">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-14 sm:mb-20">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("social_proof.label")}</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-[1.2]">{t("social_proof.title")}</h2>
        </FadeInView>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((item, i) => (
            <FadeInView key={i} delay={i * 0.08} className="relative p-7 sm:p-9 rounded-xl border border-border/60 bg-card landing-card">
              <span className="absolute top-4 left-6 text-4xl text-[hsl(var(--gold-oxide)/0.2)] leading-none select-none font-serif">&ldquo;</span>
              <blockquote className="text-sm text-foreground leading-[1.7] mb-6 pt-6 italic">
                {item.text}
              </blockquote>
              <div className="border-t border-border/40 pt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[hsl(var(--gold-oxide)/0.1)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-mono font-bold text-[hsl(var(--gold-oxide))]">{item.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
