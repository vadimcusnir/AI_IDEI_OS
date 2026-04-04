/**
 * Ecosystem Map — visual library with category groupings.
 */
import { motion } from "framer-motion";
import { IconFramework, IconAssistant, IconOutput, IconPodcast, IconExtract, IconMultiply } from "./ProprietaryIcons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ContentBoundary } from "@/components/layout/ContentBoundary";

const CATEGORIES = [
  {
    icon: IconFramework,
    title: "Frameworks",
    items: ["Copywriting formulas", "Offer structures", "Positioning models", "Content strategies"],
  },
  {
    icon: IconAssistant,
    title: "AI Assistants",
    items: ["Writing assistant", "Offer builder", "Research helper", "Campaign planner"],
  },
  {
    icon: IconOutput,
    title: "Templates",
    items: ["Email sequences", "Landing pages", "Social threads", "Sales scripts"],
  },
  {
    icon: IconPodcast,
    title: "Prompts",
    items: ["Copy prompts", "Ideation prompts", "Analysis prompts", "Strategy prompts"],
  },
  {
    icon: IconExtract,
    title: "Extraction Tools",
    items: ["Transcript analysis", "Insight extraction", "Pattern detection", "Framework mining"],
  },
  {
    icon: IconMultiply,
    title: "Execution Kits",
    items: ["Launch playbooks", "Campaign kits", "Content calendars", "Audit checklists"],
  },
];

export function EcosystemMap() {
  const reduced = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: reduced ? 0 : 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, duration: reduced ? 0 : 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
  };

  return (
    <section className="py-24 sm:py-40 border-y border-border/40" aria-label="Ecosystem overview">
      <ContentBoundary width="default">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-20 sm:mb-24">
          <span className="text-eyebrow font-mono tracking-[0.35em] text-[hsl(var(--gold-oxide))] mb-6 block">ECOSYSTEM</span>
          <h2 className="text-h2 text-foreground mb-6">Inside AI-IDEI</h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto leading-relaxed">
            A growing system of resources organized by function, not by volume.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              custom={i}
              variants={fadeUp}
              className="group p-6 sm:p-8 rounded-xl border border-border/40 bg-card/50 hover:border-[hsl(var(--gold-oxide)/0.2)] landing-card transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <cat.icon className="text-[hsl(var(--gold-oxide))] group-hover:scale-110 transition-transform duration-300" size={20} />
                <h3 className="text-caption font-bold text-foreground">{cat.title}</h3>
              </div>
              <div className="space-y-3">
                {cat.items.map((item) => (
                  <div key={item} className="flex items-center gap-3 group/item">
                    <div className="h-1 w-1 rounded-full bg-[hsl(var(--gold-oxide)/0.25)] shrink-0 group-hover/item:bg-[hsl(var(--gold-oxide)/0.5)] transition-colors" />
                    <span className="text-caption text-muted-foreground group-hover/item:text-foreground transition-colors duration-200">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-12 text-eyebrow font-mono tracking-[0.2em] text-muted-foreground">
          New resources added weekly · Built for execution, not decoration
        </motion.p>
      </ContentBoundary>
    </section>
  );
}
