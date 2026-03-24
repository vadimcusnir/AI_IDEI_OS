import { FadeInView } from "@/components/motion/PageTransition";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

export function LandingFAQ() {
  const { t } = useTranslation("landing");
  const items = t("faq.items", { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <section id="faq" className="py-24 sm:py-36 border-t border-border/60" aria-labelledby="faq-heading">
      <div className="max-w-2xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-14 sm:mb-16">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">{t("faq.label")}</span>
          <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-[1.2]">{t("faq.title")}</h2>
        </FadeInView>
        <FadeInView delay={0.1}>
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/60 rounded-xl px-6 data-[state=open]:border-[hsl(var(--gold-oxide)/0.2)] data-[state=open]:bg-card transition-all">
                <AccordionTrigger className="text-base font-semibold py-5 hover:no-underline text-foreground text-left min-h-[48px]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5 leading-[1.7]">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeInView>
      </div>
    </section>
  );
}

/** Export FAQ items for JSON-LD — uses EN fallback */
export const FAQ_ITEMS = [
  { q: "What is AI-IDEI?", a: "AI-IDEI is a practical AI system that helps you turn ideas into copy, content, offers, workflows, and marketing assets." },
  { q: "Is this for beginners or advanced users?", a: "Both. The language is clear enough for non-experts, but the resources are useful for serious operators." },
  { q: "Do I need to be good at prompting?", a: "No. The goal is not to make you memorize complicated prompts. The goal is to help you get better outputs with less friction." },
  { q: "Is this just another prompt library?", a: "No. It is built as an execution system, not a random prompt collection." },
  { q: "What can I use it for?", a: "Copywriting, content creation, offer development, positioning, messaging, planning, campaign thinking, and structured AI-assisted work." },
  { q: "Can I start for free?", a: "Yes. You can enter, explore, and decide whether it fits your workflow." },
  { q: "Who is this best for?", a: "Creators, marketers, consultants, freelancers, founders, and anyone who wants faster, clearer, more commercially useful output." },
];
