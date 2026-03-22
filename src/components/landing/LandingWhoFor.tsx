/**
 * "Who This Is For" — visual role cards, not a plain list.
 * Uses proprietary icons and asymmetric emphasis.
 */
import { motion } from "framer-motion";
import { IconPodcast, IconFramework, IconAssistant, IconOutput, IconMultiply, IconExtract } from "./ProprietaryIcons";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const ROLES = [
  { icon: IconMultiply, label: "Creators", text: "Publish faster with structure, not pressure" },
  { icon: IconOutput, label: "Freelancers", text: "Stronger messaging, more speed, less guessing" },
  { icon: IconFramework, label: "Consultants", text: "Clearer offers, sharper positioning" },
  { icon: IconExtract, label: "Marketers", text: "Better systems, better campaigns, better output" },
  { icon: IconAssistant, label: "Founders", text: "Turn scattered ideas into assets" },
  { icon: IconPodcast, label: "Operators", text: "Practical AI for execution, not hype" },
];

export function LandingWhoFor() {
  return (
    <section className="py-16 sm:py-28 border-y border-[hsl(var(--ivory-dim)/0.06)]">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
          <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">WHO THIS IS FOR</span>
          <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">
            Built for people who want output, not noise
          </h2>
          <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg mb-10 sm:mb-14">
            If you write, sell, teach, or build — this system is designed around your daily reality.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {ROLES.map((role, i) => (
            <motion.div
              key={role.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              custom={i}
              variants={fadeUp}
              className="group flex items-start gap-4 p-5 sm:p-6 rounded-lg border border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian-light)/0.2)] hover:border-[hsl(var(--gold-oxide)/0.15)] landing-card"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-[hsl(var(--gold-oxide)/0.06)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.12)] transition-colors">
                <role.icon className="text-[hsl(var(--gold-oxide)/0.5)] group-hover:text-[hsl(var(--gold-oxide)/0.8)] transition-colors" size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[hsl(var(--ivory)/0.9)] mb-1">{role.label}</p>
                <p className="text-xs text-[hsl(var(--ivory-dim)/0.45)] leading-relaxed">{role.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-[10px] text-[hsl(var(--ivory-dim)/0.25)] italic font-mono mt-8 sm:mt-10 border-t border-[hsl(var(--ivory-dim)/0.06)] pt-6">
          Not for people who want theory without execution, tools without application, or endless prompting without results.
        </motion.p>
      </div>
    </section>
  );
}
