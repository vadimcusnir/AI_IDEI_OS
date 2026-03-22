/**
 * Ecosystem Map — visual library with category groupings.
 * Replaces the flat tag list with an organized map.
 */
import { motion } from "framer-motion";
import { IconFramework, IconAssistant, IconOutput, IconPodcast, IconExtract, IconMultiply } from "./ProprietaryIcons";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

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
  return (
    <section className="py-16 sm:py-28 border-y border-[hsl(var(--ivory-dim)/0.06)]" aria-label="Ecosystem overview">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide))] mb-4 block">ECOSYSTEM</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">Inside AI-IDEI</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto text-flow">
            A growing system of resources organized by function, not by volume.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              custom={i}
              variants={fadeUp}
              className="group p-5 sm:p-6 rounded-xl border border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian-light)/0.2)] hover:border-[hsl(var(--gold-oxide)/0.12)] landing-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <cat.icon className="text-[hsl(var(--gold-oxide))] group-hover:text-[hsl(var(--gold-oxide))] transition-colors" size={20} />
                <h3 className="text-sm font-semibold text-foreground">{cat.title}</h3>
              </div>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="h-1 w-1 rounded-full bg-[hsl(var(--gold-oxide)/0.3)] shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-8 sm:mt-10 text-xs font-mono text-muted-foreground">
          New resources added weekly · Built for execution, not decoration
        </motion.p>
      </div>
    </section>
  );
}
