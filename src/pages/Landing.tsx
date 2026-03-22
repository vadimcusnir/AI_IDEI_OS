/**
 * Landing Page — AI-IDEI Knowledge Extraction Engine
 * Assembled from modular section components.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { OrganizationJsonLd, WebApplicationJsonLd, FAQJsonLd } from "@/components/seo/JsonLd";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.gif";
import { ArrowRight, Eye, Menu, X, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { useRef, useState, useCallback } from "react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OutputGalaxy } from "@/components/landing/OutputGalaxy";
import { IconControl, IconFramework, IconAssistant, IconPodcast, IconOutput } from "@/components/landing/ProprietaryIcons";

/* ── Section components ── */
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProblem } from "@/components/landing/LandingProblem";
import { LandingMechanism } from "@/components/landing/LandingMechanism";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { LandingFooter } from "@/components/landing/LandingFooter";

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

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

/* ── Extraction Spine — recurring vertical signature ── */
function ExtractionSpine({ labels }: { labels: string[] }) {
  return (
    <div className="hidden lg:flex flex-col items-center gap-0 fixed left-6 top-1/2 -translate-y-1/2 z-40" aria-hidden="true">
      <div className="w-px h-8 bg-[hsl(var(--gold-oxide)/0.2)]" />
      {labels.map((l, i) => (
        <div key={l} className="flex flex-col items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold-oxide)/0.4)] my-1" />
          <span className="text-[7px] font-mono tracking-[0.2em] text-[hsl(var(--ivory-dim)/0.4)] -rotate-90 whitespace-nowrap origin-center" style={{ writingMode: "vertical-lr" }}>
            {l}
          </span>
          {i < labels.length - 1 && <div className="w-px h-12 bg-[hsl(var(--gold-oxide)/0.1)]" />}
        </div>
      ))}
      <div className="w-px h-8 bg-[hsl(var(--gold-oxide)/0.2)]" />
    </div>
  );
}

/* ── Section Shell — consistent padding + optional alt bg ── */
function Section({ children, className, id, alt, border }: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  alt?: boolean;
  border?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 sm:py-28",
        alt && "bg-[hsl(var(--obsidian-light)/0.15)]",
        border && "border-y border-[hsl(var(--ivory-dim)/0.06)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const currentLang = LANG_OPTIONS.find(l => l.code === i18n.language) || LANG_OPTIONS[0];
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ctaAction = () => navigate(user ? "/home" : "/auth");

  const scrollTo = useCallback((selector: string) => {
    setMobileMenuOpen(false);
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const NAV_LINKS = [
    { label: "Mechanism", to: "#mechanism" },
    { label: "Outputs", to: "#outputs" },
    { label: "Control", to: "#control" },
    { label: "Access", to: "#access" },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen bg-[hsl(var(--obsidian))] text-[hsl(var(--ivory))] noise-overlay relative">
      <SEOHead
        title="AI-IDEI — AI Copywriting & Marketing Execution System"
        description="Turn one rough idea into persuasive copy, stronger offers, content assets, and real marketing execution with practical AI frameworks, prompts, and assistants."
        canonical="https://ai-idei-os.lovable.app"
      />

      <ExtractionSpine labels={["CAPTURE", "DISTILL", "STRUCTURE", "MULTIPLY", "DEPLOY"]} />

      {/* ═══ TOP BAR ═══ */}
      <div className="border-b border-[hsl(var(--ivory-dim)/0.08)]">
        <p className="text-center text-[10px] font-mono tracking-[0.15em] text-[hsl(var(--ivory-dim)/0.5)] py-2.5 px-4">
          Turn rough ideas into copy, content, offers, and campaigns — faster.
        </p>
      </div>

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian)/0.92)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group shrink-0">
            <img src={logo} alt="AI-IDEI" className="h-8 w-8 rounded-full" />
            <span className="text-sm font-serif font-bold tracking-tight text-[hsl(var(--ivory))]">AI-IDEI</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.to)}
                className="text-[10px] font-mono tracking-[0.12em] text-[hsl(var(--ivory-dim)/0.5)] hover:text-[hsl(var(--gold-oxide))] transition-colors"
              >
                {link.label.toUpperCase()}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--ivory-dim)/0.5)]" title="Language">
                  <span className="text-sm leading-none">{currentLang.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {LANG_OPTIONS.map(lang => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={cn("gap-2 text-xs", i18n.language === lang.code && "bg-accent")}
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            {user ? (
              <Button size="sm" onClick={() => navigate("/home")} className="gap-2 text-xs h-8 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))]">
                Dashboard
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs h-8 hidden sm:inline-flex text-[hsl(var(--ivory-dim)/0.6)]">
                  Log in
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5 text-xs h-8 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))] hidden sm:inline-flex">
                  Start Free
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8 w-8 flex items-center justify-center text-[hsl(var(--ivory-dim)/0.6)]"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden border-t border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian)/0.98)] overflow-hidden"
            >
              <div className="px-5 py-4 space-y-1">
                {NAV_LINKS.map(link => (
                  <button
                    key={link.label}
                    onClick={() => scrollTo(link.to)}
                    className="block w-full text-left text-xs font-mono tracking-[0.1em] text-[hsl(var(--ivory-dim)/0.6)] hover:text-[hsl(var(--gold-oxide))] transition-colors py-2.5 border-b border-[hsl(var(--ivory-dim)/0.04)]"
                  >
                    {link.label.toUpperCase()}
                  </button>
                ))}
                {!user && (
                  <div className="flex gap-3 pt-3">
                    <Button variant="ghost" size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }} className="text-xs h-9 flex-1 text-[hsl(var(--ivory-dim)/0.6)]">
                      Log in
                    </Button>
                    <Button size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }} className="gap-1.5 text-xs h-9 flex-1 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))]">
                      Start Free
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══ 1. HERO ═══ */}
      <LandingHero heroRef={heroRef} heroOpacity={heroOpacity} ctaAction={ctaAction} />


      {/* ═══ PROOF BAND ═══ */}
      <section className="border-y border-[hsl(var(--ivory-dim)/0.06)] py-5 sm:py-8">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "50+", label: "Deliverables per upload" },
              { value: "12", label: "Output families" },
              { value: "∞", label: "Knowledge reuse" },
              { value: "<2min", label: "Idea to asset" },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-xl sm:text-2xl font-mono font-bold text-[hsl(var(--gold-oxide))]">{stat.value}</p>
                <p className="text-[9px] font-mono tracking-[0.12em] text-[hsl(var(--ivory-dim)/0.4)] mt-1.5">{stat.label.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 2. PROBLEM ═══ */}
      <LandingProblem />

      {/* ═══ 3. MECHANISM ═══ */}
      <LandingMechanism />

      {/* ═══ 4. WHAT YOU GET ═══ */}
      <Section>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="mb-16">
            <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">WHAT YOU GET</span>
            <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">
              Everything you need to write, position, and market better with AI
            </h2>
            <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg">
              Inside AI-IDEI, you get practical resources built to improve execution, not impress you with complexity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[hsl(var(--ivory-dim)/0.06)] rounded-xl overflow-hidden">
            {[
              { icon: IconFramework, title: "Frameworks", text: "Use proven structures for copywriting, offers, positioning, funnels, content strategy, planning, and execution. Stop building from zero every time." },
              { icon: IconAssistant, title: "AI Assistants", text: "Use specialized assistants for writing, ideation, offer creation, research, messaging, strategy, and marketing execution." },
              { icon: IconPodcast, title: "Prompts", text: "Get prompts built for real outcomes — not random collections. Clear, adaptable, practical, designed to produce stronger outputs faster." },
              { icon: IconOutput, title: "Real Examples", text: "See how one raw idea can become a post, email, landing page, offer, campaign, script, or structured content asset." },
            ].map((block, i) => (
              <motion.div
                key={block.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i}
                variants={fadeUp}
                className="bg-[hsl(var(--obsidian-light)/0.3)] p-8 sm:p-10 group hover:bg-[hsl(var(--obsidian-light)/0.6)] transition-all"
              >
                <block.icon className="text-[hsl(var(--gold-oxide)/0.6)] mb-6 group-hover:text-[hsl(var(--gold-oxide))] transition-colors" size={28} />
                <h3 className="text-base font-semibold text-[hsl(var(--ivory)/0.9)] mb-3">{block.title}</h3>
                <p className="text-xs text-[hsl(var(--ivory-dim)/0.5)] leading-relaxed">{block.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 5. OUTPUT GALAXY ═══ */}
      <Section id="outputs" border className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--gold-oxide)/0.02)] to-transparent" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-8">
            <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">OUTPUT UNIVERSE</span>
            <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">One idea can become much more than one output</h2>
            <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg mx-auto">
              Content, education, sales, knowledge, assistants — organized into asset families.
            </p>
          </motion.div>
          <OutputGalaxy />
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-8 text-xs font-mono tracking-[0.1em] text-[hsl(var(--gold-oxide)/0.5)]">
            AI-IDEI helps you create faster, clearer, and with more commercial intent.
          </motion.p>
        </div>
      </Section>

      {/* ═══ 6. CONTROL SURFACE ═══ */}
      <Section id="control">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-16">
            <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">CONTROL LAYER</span>
            <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">You control the output. Not the other way around.</h2>
            <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg mx-auto">
              Set tone, language, format, objective, depth, and audience for every execution.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Tone", desc: "Professional, casual, authoritative" },
              { label: "Language", desc: "EN, RO, RU, and expanding" },
              { label: "Format", desc: "Post, email, page, script, thread" },
              { label: "Objective", desc: "Sell, educate, attract, convert" },
              { label: "Depth", desc: "Quick draft to deep analysis" },
              { label: "Audience", desc: "B2B, B2C, niche, broad" },
            ].map((ctrl, i) => (
              <motion.div
                key={ctrl.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="p-4 sm:p-5 rounded-lg border border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian-light)/0.3)] hover:border-[hsl(var(--gold-oxide)/0.15)] transition-colors group flex items-start gap-4 sm:block"
              >
                <IconControl className="text-[hsl(var(--gold-oxide)/0.4)] mb-0 sm:mb-3 mt-0.5 sm:mt-0 shrink-0 group-hover:text-[hsl(var(--gold-oxide)/0.7)] transition-colors" size={18} />
                <div>
                  <p className="text-xs font-semibold text-[hsl(var(--ivory)/0.85)] mb-0.5 sm:mb-1">{ctrl.label}</p>
                  <p className="text-[10px] text-[hsl(var(--ivory-dim)/0.4)]">{ctrl.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 7. WHO THIS IS FOR ═══ */}
      <Section border>
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
            <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">WHO THIS IS FOR</span>
            <h2 className="heading-2 text-[hsl(var(--ivory))] mb-8">
              Built for people who want output, not noise
            </h2>
            <div className="space-y-4 mb-8">
              {[
                "creators who want to publish faster and better",
                "freelancers who want stronger messaging and more speed",
                "consultants who need clearer offers and sharper communication",
                "marketers who want better systems and better output",
                "founders who want to turn ideas into assets and campaigns",
                "operators who want practical AI, not vague hype",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold-oxide)/0.5)] shrink-0" />
                  <span className="text-sm text-[hsl(var(--ivory)/0.75)]">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[hsl(var(--ivory-dim)/0.3)] italic border-t border-[hsl(var(--ivory-dim)/0.06)] pt-6 font-mono">
              This is not for people who want theory without execution, tools without application, or endless prompting without results.
            </p>
          </motion.div>
        </div>
      </Section>

      {/* ═══ 8. WHY DIFFERENT ═══ */}
      <Section>
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
            <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">WHY DIFFERENT</span>
            <h2 className="heading-2 text-[hsl(var(--ivory))] mb-8">
              Not another prompt pack. Not another content library.
            </h2>
            <div className="space-y-5 text-sm text-[hsl(var(--ivory-dim)/0.6)] leading-relaxed">
              <p>Most AI resources give you fragments. A few prompts. A few ideas. A few templates. A little inspiration.</p>
              <p>Then you are back in the same place: still thinking, still guessing, still rebuilding from scratch.</p>
              <blockquote className="py-6 border-y border-[hsl(var(--gold-oxide)/0.15)] my-6">
                <p className="text-[hsl(var(--ivory)/0.9)] font-serif font-bold text-base sm:text-lg leading-snug">
                  AI-IDEI is different because it is built around one goal: help you turn thought into execution.
                </p>
              </blockquote>
              <div className="space-y-3">
                {["clearer direction", "better structure", "faster production", "stronger commercial communication", "more usable output from less mental friction"].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold-oxide)/0.5)] shrink-0" />
                    <span className="text-[hsl(var(--ivory)/0.8)] text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <p className="pt-4 text-[hsl(var(--ivory)/0.7)] font-semibold italic">It is not built to look smart. It is built to help you produce.</p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══ 9. BENEFITS ═══ */}
      <LandingBenefits />

      {/* ═══ 10. SOCIAL PROOF ═══ */}
      <LandingSocialProof />

      {/* ═══ 11. LIBRARY PREVIEW ═══ */}
      <Section border className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-10">
            <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">ASSET LIBRARY</span>
            <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">Inside AI-IDEI</h2>
            <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg mx-auto">
              Explore a growing system of practical resources for copywriting, marketing, and business execution.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-wrap justify-center gap-2">
            {[
              "copywriting", "marketing angles", "offer design", "content creation",
              "messaging", "AI workflows", "planning", "strategic thinking",
              "execution support", "assistant systems", "prompts", "frameworks",
            ].map((cat, i) => (
              <motion.span
                key={cat}
                custom={i}
                variants={fadeUp}
                className="text-[10px] font-mono tracking-[0.08em] px-4 py-2 rounded border border-[hsl(var(--ivory-dim)/0.08)] text-[hsl(var(--ivory-dim)/0.5)] hover:border-[hsl(var(--gold-oxide)/0.2)] hover:text-[hsl(var(--gold-oxide)/0.7)] transition-all cursor-default uppercase"
              >
                {cat}
              </motion.span>
            ))}
          </motion.div>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-8 text-[11px] text-[hsl(var(--ivory-dim)/0.35)]">
            Everything is built to help you move from idea to action with less friction and stronger results.
          </motion.p>
        </div>
      </Section>

      {/* ═══ 11.5 TRANSCRIBE CTA ═══ */}
      <Section className="py-12 sm:py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={0} variants={fadeUp} className="max-w-3xl mx-auto px-5 sm:px-6">
          <div className="relative rounded-xl border border-[hsl(var(--ivory-dim)/0.08)] bg-[hsl(var(--obsidian-light)/0.4)] p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[hsl(var(--signal-red)/0.04)] rounded-full blur-[80px]" />
            <div className="relative shrink-0 w-14 h-14 rounded-xl bg-[hsl(var(--signal-red)/0.08)] flex items-center justify-center">
              <Youtube className="h-7 w-7 text-[hsl(var(--signal-red)/0.7)]" />
            </div>
            <div className="relative flex-1 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--ivory)/0.9)] mb-2">
                YouTube → Transcript in 2 seconds
              </h3>
              <p className="text-xs text-[hsl(var(--ivory-dim)/0.5)] leading-relaxed mb-4 sm:mb-0">
                Paste a YouTube link, download the full transcript. First one free.
              </p>
            </div>
            <Button
              onClick={() => navigate("/transcribe")}
              size="sm"
              className="relative gap-2 text-xs h-10 px-6 bg-[hsl(var(--signal-red)/0.15)] hover:bg-[hsl(var(--signal-red)/0.25)] text-[hsl(var(--ivory)/0.9)] border border-[hsl(var(--signal-red)/0.2)] shrink-0"
            >
              Try Transcribe
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      </Section>

      {/* ═══ 12. PRICING ═══ */}
      <Section id="access">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-16">
            <span className="text-[9px] font-mono tracking-[0.25em] text-[hsl(var(--gold-oxide)/0.6)] mb-4 block">ACCESS</span>
            <h2 className="heading-2 text-[hsl(var(--ivory))] mb-4">Choose the level that matches your ambition</h2>
            <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] max-w-lg mx-auto">
              Start simple. Upgrade when you want more depth, speed, and leverage.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[hsl(var(--ivory-dim)/0.06)] rounded-xl overflow-hidden max-w-4xl mx-auto">
            {[
              { name: "Free", promise: "Test the system", text: "Get inside, explore, and see how AI-IDEI works before making a commitment.", cta: "Start Free", featured: false },
              { name: "Core", promise: "Build clarity", text: "For people who want practical access to essentials for better copy, content, and execution.", cta: "Choose Core", featured: false },
              { name: "Pro", promise: "Produce more", text: "Deeper access, advanced resources, and stronger leverage across copywriting and marketing.", cta: "Choose Pro", featured: true },
              { name: "Elite", promise: "Full power", text: "For serious operators who want the most complete version and premium execution resources.", cta: "Choose Elite", featured: false },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i}
                variants={fadeUp}
                className={cn(
                  "p-6 sm:p-8 flex flex-col relative",
                  plan.featured
                    ? "bg-[hsl(var(--obsidian-light))] ring-1 ring-[hsl(var(--gold-oxide)/0.3)]"
                    : "bg-[hsl(var(--obsidian-light)/0.3)]"
                )}
              >
                {plan.featured && (
                  <span className="absolute top-3 right-3 text-[7px] font-mono tracking-[0.2em] text-[hsl(var(--gold-oxide))] border border-[hsl(var(--gold-oxide)/0.3)] px-2 py-0.5 rounded">POPULAR</span>
                )}
                <h3 className="text-lg font-bold text-[hsl(var(--ivory)/0.9)]">{plan.name}</h3>
                <p className="text-[10px] font-mono tracking-[0.1em] text-[hsl(var(--gold-oxide)/0.7)] mt-1 mb-4">{plan.promise.toUpperCase()}</p>
                <p className="text-xs text-[hsl(var(--ivory-dim)/0.45)] leading-relaxed flex-1">{plan.text}</p>
                <Button
                  onClick={ctaAction}
                  className={cn(
                    "w-full mt-6 gap-2 text-xs h-10",
                    plan.featured
                      ? "bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))]"
                      : "bg-transparent border border-[hsl(var(--ivory-dim)/0.12)] text-[hsl(var(--ivory-dim)/0.6)] hover:border-[hsl(var(--gold-oxide)/0.3)] hover:text-[hsl(var(--gold-oxide))]"
                  )}
                  size="sm"
                >
                  {plan.cta}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 13. FAQ ═══ */}
      <Section id="faq" border className="border-b-0">
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
      </Section>

      {/* ═══ 14. FINAL CTA ═══ */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[hsl(var(--gold-oxide)/0.05)] rounded-full blur-[180px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
            <h2 className="heading-2 text-[hsl(var(--ivory))] mb-5">
              Stop collecting ideas.
              <br />
              <span className="text-[hsl(var(--gold-oxide))]">Start turning them into assets.</span>
            </h2>
            <p className="text-sm text-[hsl(var(--ivory-dim)/0.5)] mb-12 max-w-lg mx-auto leading-relaxed">
              Use AI-IDEI to write faster, market better, and turn rough thinking into persuasive output.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
              <Button size="lg" onClick={ctaAction} className="gap-2 px-10 h-12 sm:h-14 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))] font-semibold shadow-lg shadow-[hsl(var(--gold-oxide)/0.15)] w-full sm:w-auto">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.querySelector("#mechanism")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 h-12 sm:h-14 w-full sm:w-auto border-[hsl(var(--ivory-dim)/0.15)] text-[hsl(var(--ivory-dim)/0.7)] hover:bg-[hsl(var(--ivory-dim)/0.05)]">
                <Eye className="h-4 w-4" />
                See What's Inside
              </Button>
            </div>
            <p className="text-[10px] font-mono tracking-[0.15em] text-[hsl(var(--ivory-dim)/0.3)]">
              LESS FRICTION · BETTER COPY · STRONGER EXECUTION
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ 15. FOOTER ═══ */}
      <LandingFooter />

      <OrganizationJsonLd />
      <WebApplicationJsonLd />
      <FAQJsonLd items={FAQS.map(f => ({ question: f.q, answer: f.a }))} />
    </div>
    </PageTransition>
  );
}
