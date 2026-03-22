/**
 * What You Get — 4-block grid with proprietary icons.
 */
import { motion } from "framer-motion";
import { IconFramework, IconAssistant, IconPodcast, IconOutput } from "./ProprietaryIcons";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const BLOCKS = [
  { icon: IconFramework, title: "Frameworks", text: "Use proven structures for copywriting, offers, positioning, funnels, content strategy, planning, and execution. Stop building from zero every time." },
  { icon: IconAssistant, title: "AI Assistants", text: "Use specialized assistants for writing, ideation, offer creation, research, messaging, strategy, and marketing execution." },
  { icon: IconPodcast, title: "Prompts", text: "Get prompts built for real outcomes — not random collections. Clear, adaptable, practical, designed to produce stronger outputs faster." },
  { icon: IconOutput, title: "Real Examples", text: "See how one raw idea can become a post, email, landing page, offer, campaign, script, or structured content asset." },
];

export function LandingWhatYouGet() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="mb-10 sm:mb-16">
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">WHAT YOU GET</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">
            Everything you need to write, position, and market better with AI
          </h2>
          <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg">
            Inside AI-IDEI, you get practical resources built to improve execution, not impress you with complexity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[hsl(var(--ivory-dim)/0.06)] rounded-xl overflow-hidden">
          {BLOCKS.map((block, i) => (
            <motion.div
              key={block.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
              variants={fadeUp}
              className="bg-[hsl(var(--obsidian-light)/0.3)] p-6 sm:p-10 group hover:bg-[hsl(var(--obsidian-light)/0.6)] transition-all"
            >
              <block.icon className="text-[hsl(var(--gold-oxide)/0.6)] mb-6 group-hover:text-[hsl(var(--gold-oxide))] transition-colors" size={28} />
              <h3 className="text-base font-semibold text-[hsl(var(--ivory)/0.9)] mb-3">{block.title}</h3>
              <p className="text-xs text-[hsl(var(--ivory-dim)/0.5)] leading-relaxed">{block.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
