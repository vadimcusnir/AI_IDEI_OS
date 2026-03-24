/**
 * Ecosystem Map — visual library with category groupings.
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
    <section className="py-20 sm:py-32 border-y border-border/40" aria-label="Ecosystem overview">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-14 sm:mb-20">
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-[hsl(var(--gold-oxide))] mb-5 block">ECOSYSTEM</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-5 leading-[1.2]">Inside AI-IDEI</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-[1.7]">
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
              className="group p-6 sm:p-7 rounded-xl border border-border/40 bg-card/50 hover:border-[hsl(var(--gold-oxide)/0.15)] landing-card"
            >
              <div className="flex items-center gap-3.5 mb-5">
                <cat.icon className="text-[hsl(var(--gold-oxide))] transition-colors" size={20} />
                <h3 className="text-sm font-bold text-foreground">{cat.title}</h3>
              </div>
              <div className="space-y-2.5">
                {cat.items.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-1 w-1 rounded-full bg-[hsl(var(--gold-oxide)/0.3)] shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-10 text-[11px] font-mono tracking-wider uppercase text-muted-foreground">
          New resources added weekly · Built for execution, not decoration
        </motion.p>
      </div>
    </section>
  );
}
