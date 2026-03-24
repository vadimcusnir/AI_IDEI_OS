import { FadeInView } from "@/components/motion/PageTransition";
import { IconExtract, IconFramework, IconOutput, IconMultiply } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

const ICONS = [IconExtract, IconFramework, IconOutput, IconMultiply];

export function LandingMechanism() {
  const { t } = useTranslation("landing");
  const steps = t("mechanism.steps", { returnObjects: true }) as Array<{ num: string; title: string; text: string }>;
  const transforms = t("mechanism.transforms", { returnObjects: true }) as Array<{ from: string; to: string }>;

  return (
    <section id="mechanism" className="py-24 sm:py-36 border-y border-border/60" aria-labelledby="mechanism-heading">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16 sm:mb-20">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("mechanism.label")}</span>
          <h2 id="mechanism-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5 leading-[1.2]">{t("mechanism.title")}</h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-[1.7]">
            {t("mechanism.subtitle")}
          </p>
        </FadeInView>

        {/* 4-step grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/60 rounded-xl overflow-hidden mb-20">
          {steps.map((step, i) => {
            const StepIcon = ICONS[i];
            return (
              <FadeInView key={step.num} delay={i * 0.08} className="bg-card p-7 sm:p-9 group hover:bg-accent/5 transition-colors">
                <div className="flex items-center justify-between mb-7">
                  <span className="text-3xl font-mono font-bold text-[hsl(var(--gold-oxide)/0.12)] group-hover:text-[hsl(var(--gold-oxide)/0.25)] transition-colors">{step.num}</span>
                  <StepIcon className="text-[hsl(var(--gold-oxide))]" size={22} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-[1.7]">{step.text}</p>
              </FadeInView>
            );
          })}
        </div>

        {/* Transform list */}
        <div className="space-y-1.5 max-w-3xl mx-auto">
          {transforms.map((t_item, i) => (
            <FadeInView key={i} delay={i * 0.05} className="flex items-center gap-5 py-3.5 px-5 rounded-lg hover:bg-accent/5 transition-colors">
              <span className="text-sm font-mono text-muted-foreground min-w-[140px] sm:min-w-[200px]">{t_item.from}</span>
              <span className="text-[hsl(var(--gold-oxide))] font-mono text-sm shrink-0">→</span>
              <span className="text-sm text-foreground font-medium">{t_item.to}</span>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
