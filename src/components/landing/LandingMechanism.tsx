import { FadeInView } from "@/components/motion/PageTransition";
import { IconExtract, IconFramework, IconOutput, IconMultiply } from "./ProprietaryIcons";
import { useTranslation } from "react-i18next";

const ICONS = [IconExtract, IconFramework, IconOutput, IconMultiply];

export function LandingMechanism() {
  const { t } = useTranslation("landing");
  const steps = t("mechanism.steps", { returnObjects: true }) as Array<{ num: string; title: string; text: string }>;
  const transforms = t("mechanism.transforms", { returnObjects: true }) as Array<{ from: string; to: string }>;

  return (
    <section id="mechanism" className="py-32 sm:py-44 border-y border-border/50" aria-labelledby="mechanism-heading">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-20 sm:mb-28">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-6 block">{t("mechanism.label")}</span>
          <h2 id="mechanism-heading" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-[-0.01em] text-foreground mb-6 leading-[1.15]">{t("mechanism.title")}</h2>
          <p className="text-[15px] text-muted-foreground max-w-[480px] mx-auto leading-[1.75]">
            {t("mechanism.subtitle")}
          </p>
        </FadeInView>

        {/* 4-step grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50 rounded-xl overflow-hidden mb-28">
          {steps.map((step, i) => {
            const StepIcon = ICONS[i];
            return (
              <FadeInView key={step.num} delay={i * 0.1} className="bg-card p-8 sm:p-10 group hover:bg-accent/5 transition-all duration-300 landing-card">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-4xl font-mono font-bold text-[hsl(var(--gold-oxide)/0.1)] group-hover:text-[hsl(var(--gold-oxide)/0.28)] transition-colors duration-300 leading-none">{step.num}</span>
                  <StepIcon className="text-[hsl(var(--gold-oxide))] group-hover:scale-110 transition-transform duration-300" size={22} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-[1.7]">{step.text}</p>
              </FadeInView>
            );
          })}
        </div>

        {/* Transform list */}
        <div className="space-y-1 max-w-3xl mx-auto">
          {transforms.map((t_item, i) => (
            <FadeInView key={i} delay={i * 0.05} className="flex items-center gap-3 sm:gap-6 py-4 px-3 sm:px-5 rounded-lg hover:bg-accent/5 transition-all duration-200 group">
              <span className="text-xs sm:text-sm font-mono text-muted-foreground min-w-[100px] sm:min-w-[200px] group-hover:text-foreground transition-colors duration-200">{t_item.from}</span>
              <span className="text-[hsl(var(--gold-oxide))] font-mono text-sm shrink-0 group-hover:scale-125 transition-transform duration-200">→</span>
              <span className="text-sm text-foreground font-medium">{t_item.to}</span>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
