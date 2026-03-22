/**
 * What You Get — 4-block grid with proprietary icons.
 */
import { FadeInView } from "@/components/motion/PageTransition";
import { IconFramework, IconAssistant, IconPodcast, IconOutput } from "./ProprietaryIcons";

const BLOCKS = [
  { icon: IconFramework, title: "Frameworks", text: "Use proven structures for copywriting, offers, positioning, funnels, content strategy, planning, and execution. Stop building from zero every time." },
  { icon: IconAssistant, title: "AI Assistants", text: "Use specialized assistants for writing, ideation, offer creation, research, messaging, strategy, and marketing execution." },
  { icon: IconPodcast, title: "Prompts", text: "Get prompts built for real outcomes — not random collections. Clear, adaptable, practical, designed to produce stronger outputs faster." },
  { icon: IconOutput, title: "Real Examples", text: "See how one raw idea can become a post, email, landing page, offer, campaign, script, or structured content asset." },
];

export function LandingWhatYouGet() {
  return (
    <section className="py-20 sm:py-28" aria-label="What you get">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <FadeInView className="mb-10 sm:mb-16">
          <span className="text-xs font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] mb-4 block">WHAT YOU GET</span>
          <h2 className="heading-2 mb-4">
            Everything you need to write, position, and market better with AI
          </h2>
          <p className="text-base text-muted-foreground max-w-lg text-flow">
            Inside AI-IDEI, you get practical resources built to improve execution, not impress you with complexity.
          </p>
        </FadeInView>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden">
          {BLOCKS.map((block, i) => (
            <FadeInView
              key={block.title}
              delay={i * 0.08}
              className="bg-card p-6 sm:p-10 group hover:bg-accent/5 transition-all"
            >
              <block.icon className="text-[hsl(var(--gold-oxide))] mb-6 transition-colors" size={28} />
              <h3 className="text-lg font-semibold text-foreground mb-3">{block.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed text-flow">{block.text}</p>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}
