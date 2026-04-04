import { FadeInView } from "@/components/motion/PageTransition";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

export function LandingFAQ() {
  const { t } = useTranslation("landing");
  const items = t("faq.items", { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <section id="faq" className="py-32 sm:py-44 border-t border-border/50" aria-labelledby="faq-heading">
      <div className="max-w-2xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-16 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.3em] text-gold mb-6 block">{t("faq.label")}</span>
          <h2 id="faq-heading" className="text-h2 text-foreground">{t("faq.title")}</h2>
        </FadeInView>
        <FadeInView delay={0.1}>
          <Accordion type="single" collapsible className="space-y-3.5">
            {items.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl px-6 data-[state=open]:border-gold/22 data-[state=open]:bg-card data-[state=open]:shadow-sm transition-all">
                <AccordionTrigger className="text-sm font-semibold py-5.5 hover:no-underline text-foreground text-left min-h-[52px]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-6 leading-[1.75]">
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
