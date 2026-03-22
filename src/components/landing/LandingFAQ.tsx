/**
 * FAQ Section — accordion with gold accents.
 */
import { FadeInView } from "@/components/motion/PageTransition";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  { q: "What is AI-IDEI?", a: "AI-IDEI is a practical AI system that helps you turn ideas into copy, content, offers, workflows, and marketing assets." },
  { q: "Is this for beginners or advanced users?", a: "Both. The language is clear enough for non-experts, but the resources are useful for serious operators." },
  { q: "Do I need to be good at prompting?", a: "No. The goal is not to make you memorize complicated prompts. The goal is to help you get better outputs with less friction." },
  { q: "Is this just another prompt library?", a: "No. It is built as an execution system, not a random prompt collection." },
  { q: "What can I use it for?", a: "Copywriting, content creation, offer development, positioning, messaging, planning, campaign thinking, and structured AI-assisted work." },
  { q: "Can I start for free?", a: "Yes. You can enter, explore, and decide whether it fits your workflow." },
  { q: "Who is this best for?", a: "Creators, marketers, consultants, freelancers, founders, and anyone who wants faster, clearer, more commercially useful output." },
];

export function LandingFAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28 border-t border-border">
      <div className="max-w-2xl mx-auto px-5 sm:px-6">
        <FadeInView className="text-center mb-12">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide)/0.7)] mb-4 block">FAQ</span>
          <h2 className="heading-2">Frequently Asked Questions</h2>
        </FadeInView>
        <FadeInView delay={0.1}>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-5 data-[state=open]:border-[hsl(var(--gold-oxide)/0.2)] data-[state=open]:bg-card transition-all">
                <AccordionTrigger className="text-base font-medium py-4 hover:no-underline text-foreground/85 text-left min-h-[44px]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
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

/** Export FAQ items for JSON-LD */
export const FAQ_ITEMS = FAQS;
