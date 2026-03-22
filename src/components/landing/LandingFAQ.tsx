/**
 * FAQ Section — accordion with gold accents.
 */
import { motion } from "framer-motion";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

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
    <section id="faq" className="py-20 sm:py-28 border-y border-[hsl(var(--ivory-dim)/0.06)] border-b-0">
      <div className="max-w-2xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-12">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">FAQ</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))]">Frequently Asked Questions</h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={1} variants={fadeUp}>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-[hsl(var(--ivory-dim)/0.06)] rounded-lg px-5 data-[state=open]:border-[hsl(var(--gold-oxide)/0.15)] data-[state=open]:bg-[hsl(var(--obsidian-light)/0.3)] transition-all">
                <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline text-[hsl(var(--ivory)/0.8)] text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[hsl(var(--ivory-dim)/0.5)] pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

/** Export FAQ items for JSON-LD */
export const FAQ_ITEMS = FAQS;
