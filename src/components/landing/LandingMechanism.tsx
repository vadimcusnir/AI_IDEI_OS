import { FadeInView } from "@/components/motion/PageTransition";
import { IconExtract, IconFramework, IconOutput, IconMultiply } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

const ICONS = [IconExtract, IconFramework, IconOutput, IconMultiply];

export function LandingMechanism() {
  const { t } = useTranslation("landing");
  const steps = t("mechanism.steps", { returnObjects: true }) as Array<{ num: string; title: string; text: string }>;
  const transforms = t("mechanism.transforms", { returnObjects: true }) as Array<{ from: string; to: string }>;

  return (
    <section id="mechanism" className="py-20 sm:py-28 border-y border-border" aria-labelledby="mechanism-heading">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">{t("mechanism.label")}</span>
          <h2 id="mechanism-heading" className="heading-2 mb-4">{t("mechanism.title")}</h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto text-flow">
            {t("mechanism.subtitle")}
          </p>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden mb-16">
          {steps.map((step, i) => {
            const StepIcon = ICONS[i];
            return (
              <FadeInView key={step.num} delay={i * 0.08} className="bg-card p-6 sm:p-8 group hover:bg-accent/5 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-mono font-bold text-[hsl(var(--gold-oxide)/0.15)] group-hover:text-[hsl(var(--gold-oxide)/0.3)] transition-colors">{step.num}</span>
                  <StepIcon className="text-[hsl(var(--gold-oxide))]" size={20} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed text-flow">{step.text}</p>
              </FadeInView>
            );
          })}
        </div>

        <div className="space-y-2">
          {transforms.map((t_item, i) => (
            <FadeInView key={i} delay={i * 0.06} className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-accent/5 transition-colors">
              <span className="text-sm font-mono text-muted-foreground min-w-[140px] sm:min-w-[180px]">{t_item.from}</span>
              <span className="text-[hsl(var(--gold-oxide))] font-mono text-sm">→</span>
              <span className="text-sm text-foreground">{t_item.to}</span>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}