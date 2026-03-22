import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { OrganizationJsonLd, WebApplicationJsonLd, FAQJsonLd } from "@/components/seo/JsonLd";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.gif";
import {
  ArrowRight, CheckCircle2, ChevronRight,
  Zap, Lightbulb,
  Bot, TrendingUp,
  Target, Gem, PenTool, LayoutTemplate,
  MessageSquare, Sparkles, Eye, Rocket,
  CircleDot, Star, Crown, Shield, Cpu, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { lazy, Suspense, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Footer = lazy(() => import("@/components/global/Footer").then(m => ({ default: m.Footer })));

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ── Shared section wrapper for consistent rhythm ── */
const SectionShell = ({
  children,
  className,
  alt = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  alt?: boolean;
  id?: string;
}) => (
  <section
    id={id}
    className={cn(
      "py-16 sm:py-24 md:py-28",
      alt && "bg-card border-y border-border",
      className,
    )}
  >
    {children}
  </section>
);

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const currentLang = LANG_OPTIONS.find(l => l.code === i18n.language) || LANG_OPTIONS[0];
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);

  const ctaAction = () => navigate(user ? "/home" : "/auth");

  const TRANSFORMATIONS = [
    { from: "A rough thought", to: "becomes a social post that actually communicates value" },
    { from: "A messy service", to: "becomes a clearer offer with stronger positioning" },
    { from: "A long transcript", to: "becomes a newsletter, article, thread, and email sequence" },
    { from: "A weak landing page", to: "becomes sharper copy with more persuasive structure" },
    { from: "Scattered notes", to: "become a content plan, product outline, or conversion asset" },
    { from: "A vague marketing angle", to: "becomes a usable campaign direction" },
  ];

  const STEPS = [
    { num: "01", title: "Choose the problem", text: "Start with what you need right now: copy, content, positioning, offer clarity, campaign structure, planning, or execution support." },
    { num: "02", title: "Use the right resource", text: "Pick a framework, prompt, assistant, or example designed for that exact type of work." },
    { num: "03", title: "Turn it into an asset", text: "Produce something usable: a post, an email, a landing page, an offer, a script, a content plan, or a campaign asset." },
    { num: "04", title: "Repeat with speed", text: "Once the system clicks, you stop improvising and start producing with more clarity, consistency, and momentum." },
  ];

  const BENEFITS = [
    { icon: Target, title: "You stop wasting time on blank starts", text: "You get structure, direction, and ready-to-use resources that make starting dramatically easier." },
    { icon: Zap, title: "You write faster without lowering quality", text: "Instead of improvising every time, you use reusable systems that improve speed and consistency." },
    { icon: MessageSquare, title: "Your offers become easier to explain and sell", text: "Better wording creates better positioning. Better positioning creates stronger conversion." },
    { icon: Cpu, title: "You turn AI into a real working advantage", text: "Not random prompting. Not chaotic experimentation. A more intentional, more useful, more profitable way to work." },
  ];

  const CATEGORIES = [
    "copywriting", "marketing angles", "offer design", "content creation",
    "messaging", "AI workflows", "planning", "strategic thinking",
    "execution support", "assistant systems", "prompts", "frameworks",
  ];

  const FAQS = [
    { q: "What is AI-IDEI?", a: "AI-IDEI is a practical AI system that helps you turn ideas into copy, content, offers, workflows, and marketing assets." },
    { q: "Is this for beginners or advanced users?", a: "Both. The language is clear enough for non-experts, but the resources are useful for serious operators." },
    { q: "Do I need to be good at prompting?", a: "No. The goal is not to make you memorize complicated prompts. The goal is to help you get better outputs with less friction." },
    { q: "Is this just another prompt library?", a: "No. It is built as an execution system, not a random prompt collection." },
    { q: "What can I use it for?", a: "Copywriting, content creation, offer development, positioning, messaging, planning, campaign thinking, and structured AI-assisted work." },
    { q: "Can I start for free?", a: "Yes. You can enter, explore, and decide whether it fits your workflow." },
    { q: "Who is this best for?", a: "Creators, marketers, consultants, freelancers, founders, and anyone who wants faster, clearer, more commercially useful output." },
  ];

  const PLANS = [
    { name: "Free", icon: CircleDot, promise: "Test the system", text: "Get inside, explore the experience, and see how AI-IDEI works before making a commitment.", cta: "Start Free", featured: false },
    { name: "Core", icon: Star, promise: "Build clarity and consistency", text: "For people who want practical access to the essential tools for better copy, content, and AI-assisted execution.", cta: "Choose Core", featured: false },
    { name: "Pro", icon: Gem, promise: "Produce more with stronger systems", text: "For people who want deeper access, more advanced resources, and stronger leverage across copywriting, marketing, and workflow execution.", cta: "Choose Pro", featured: true },
    { name: "Elite", icon: Crown, promise: "Use the system at full power", text: "For serious operators who want the most complete version of AI-IDEI and access to high-value execution resources.", cta: "Choose Elite", featured: false },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AI-IDEI — AI Copywriting & Marketing Execution System"
        description="Turn one rough idea into persuasive copy, stronger offers, content assets, and real marketing execution with practical AI frameworks, prompts, and assistants."
        canonical="https://ai-idei-os.lovable.app"
      />

      {/* ═══ TOP BAR ═══ */}
      <div className="bg-primary/5 border-b border-primary/10">
        <p className="text-center text-xs text-muted-foreground py-2.5 px-4 tracking-wide">
          Turn rough ideas into copy, content, offers, and campaigns — faster.
        </p>
      </div>

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group shrink-0">
            <img src={logo} alt="AI-IDEI" className="h-8 w-8 rounded-full group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow" />
            <span className="text-base font-serif font-bold tracking-tight">AI-IDEI</span>
          </button>
          <nav className="hidden lg:flex items-center gap-8">
            {[
              { label: "How It Works", to: "#how-it-works" },
              { label: "What You Get", to: "#what-you-get" },
              { label: "Pricing", to: "#pricing" },
              { label: "FAQ", to: "#faq" },
            ].map(link => (
              <button
                key={link.label}
                onClick={() => document.querySelector(link.to)?.scrollIntoView({ behavior: "smooth" })}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Language">
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
              <Button size="sm" onClick={() => navigate("/home")} className="gap-2 text-xs h-8">
                Dashboard
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs h-8 hidden sm:inline-flex">
                  Log in
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5 text-xs h-8">
                  Start Free
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.05] rounded-full blur-[180px] animate-float" />
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-accent/[0.04] rounded-full blur-[140px] animate-float [animation-delay:3s]" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative max-w-3xl mx-auto px-5 sm:px-6 pt-20 sm:pt-32 md:pt-40 pb-16 sm:pb-28 text-center">
          {/* Logo mark */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05, duration: 0.5 }} className="mb-8">
            <img src={logo} alt="" className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl mx-auto shadow-xl shadow-primary/10" />
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} className="eyebrow mb-6 sm:mb-8">
            AI Copywriting & Marketing Execution System
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }} className="heading-1 mb-6 sm:mb-8 px-2">
            The closest thing to a{" "}
            <span className="relative inline-block text-primary">
              magic button
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <motion.path
                  d="M2 8C50 2 250 2 298 8"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.35"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.9, duration: 1, ease: "easeInOut" }}
                />
              </svg>
            </span>
            {" "}for copywriting and marketing
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-5 sm:mb-6">
            Turn one rough idea into persuasive copy, stronger offers, content assets, and real marketing execution with practical AI frameworks, prompts, and assistants built for real work.
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }} className="text-xs text-muted-foreground/60 mb-10 sm:mb-12">
            Built for creators, marketers, consultants, freelancers, and founders who want speed, clarity, and better output.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12">
            <Button size="lg" onClick={ctaAction} className="btn-glow gap-2 text-sm px-10 h-12 sm:h-13 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto">
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.querySelector("#what-you-get")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 text-sm h-12 sm:h-13 w-full sm:w-auto">
              <Eye className="h-4 w-4" />
              See What's Inside
            </Button>
          </motion.div>

          {/* Trust strip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { icon: CheckCircle2, text: "Practical" },
              { icon: Shield, text: "Clear" },
              { icon: Zap, text: "Fast" },
              { icon: Rocket, text: "Built for execution" },
            ].map(item => (
              <span key={item.text} className="flex items-center gap-1.5 text-xs text-muted-foreground/50 font-medium">
                <item.icon className="h-3 w-3" />
                {item.text}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 2 — THE PROBLEM ═══ */}
      <SectionShell alt>
        <div className="text-flow px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
            <div className="inline-flex items-center gap-2 mb-5">
              <div className="h-1 w-6 rounded-full bg-destructive" />
              <span className="eyebrow text-destructive">The Problem</span>
            </div>
            <h2 className="heading-2 mb-8">
              Most people do not struggle with ideas. They struggle with turning ideas into assets.
            </h2>
            <div className="body-text space-y-5">
              <p>You have thoughts. Notes. Drafts. Angles. Offers. Half-built campaigns. Fragments of good copy.</p>
              <p className="font-medium text-foreground text-base">But the real bottleneck is not creativity. It is execution.</p>
              <div className="pl-5 border-l-2 border-primary/20 space-y-1.5 text-sm text-muted-foreground/70">
                <p>You open ChatGPT.</p>
                <p>You test random prompts.</p>
                <p>You save interesting things.</p>
                <p>You try to write.</p>
                <p>You restart.</p>
                <p>You overthink.</p>
                <p>You lose momentum.</p>
              </div>
              <p className="font-medium text-foreground">So the result looks like this:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {["too many ideas", "weak positioning", "slow writing", "unclear offers", "inconsistent content", "scattered marketing execution"].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive/60 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-6 mt-2 border-t border-border">
                <p className="text-foreground font-semibold text-base">AI-IDEI closes that gap.</p>
                <p className="mt-2">It helps you turn raw thinking into usable copy, structured content, stronger messaging, and faster marketing output.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 3 — THE CORE PROMISE ═══ */}
      <SectionShell>
        <div className="text-flow px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
            <div className="inline-flex items-center gap-2 mb-5">
              <div className="h-1 w-6 rounded-full bg-primary" />
              <span className="eyebrow">The Core Promise</span>
            </div>
            <h2 className="heading-2 mb-8">
              From rough thought to persuasive output
            </h2>
            <div className="body-text space-y-5">
              <p>AI-IDEI is designed to make copywriting and marketing feel radically easier.</p>
              <p>Instead of guessing what to write, how to structure it, how to phrase it, or how to package it, you use a system that helps you move faster and think better.</p>
              <div className="space-y-3 pt-2">
                {["write faster", "sharpen your message", "build stronger offers", "create more content from one idea", "reduce blank-page friction", "turn scattered thinking into commercial assets"].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-foreground text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <p className="pt-4 text-foreground font-semibold italic text-base">This is not inspiration. This is usable leverage.</p>
            </div>
          </motion.div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 4 — WHAT YOU GET ═══ */}
      <SectionShell id="what-you-get" alt>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-14 sm:mb-16">
            <h2 className="heading-2 mb-4">
              Everything you need to write, position, and market better with AI
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Inside AI-IDEI, you get practical resources built to improve execution, not impress you with complexity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {[
              { icon: LayoutTemplate, title: "Frameworks", text: "Use proven structures for copywriting, offers, positioning, funnels, content strategy, planning, and execution. Stop building from zero every time." },
              { icon: MessageSquare, title: "Prompts", text: "Get prompts built for real outcomes — not random collections. Clear, adaptable, practical, and designed to help you produce stronger outputs faster." },
              { icon: Bot, title: "AI Assistants", text: "Use specialized assistants for writing, ideation, offer creation, research, messaging, strategy, and marketing execution." },
              { icon: Lightbulb, title: "Real Examples", text: "See how one raw idea can become a post, email, landing page, offer, campaign, script, or structured content asset." },
            ].map((block, i) => (
              <motion.div key={block.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={i} variants={fadeUp} className="p-6 sm:p-8 rounded-2xl border border-border bg-background hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <block.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="heading-3 mb-3">{block.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{block.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 5 — WHAT IT HELPS YOU CREATE ═══ */}
      <SectionShell>
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-14">
            <h2 className="heading-2 mb-4">
              One idea can become much more than one output
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              With the right system, a single idea stops being a thought and starts becoming leverage.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="space-y-3">
            {TRANSFORMATIONS.map((t, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="flex items-start gap-4 p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/20 hover:bg-card/80 transition-all group">
                <div className="shrink-0 mt-0.5">
                  <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
                    <span className="text-xs font-mono font-bold text-primary/60">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t.from}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-primary font-medium">→</span> {t.to}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={6} variants={fadeUp} className="text-center mt-10 text-sm font-semibold text-primary">
            AI-IDEI helps you create faster, clearer, and with more commercial intent.
          </motion.p>
        </div>
      </SectionShell>

      {/* ═══ SECTION 6 — HOW IT WORKS ═══ */}
      <SectionShell id="how-it-works" alt>
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-14 sm:mb-16">
            <h2 className="heading-2">Simple process. Stronger output.</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {STEPS.map((step, i) => (
              <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={i} variants={fadeUp} className="relative p-6 rounded-2xl border border-border bg-background group hover:border-primary/25 transition-all">
                <span className="text-4xl font-mono font-bold text-primary/12 group-hover:text-primary/20 transition-colors leading-none">{step.num}</span>
                <h3 className="heading-4 mt-3 mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 7 — WHO THIS IS FOR ═══ */}
      <SectionShell>
        <div className="text-flow px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
            <h2 className="heading-2 mb-6 sm:mb-8">
              Built for people who want output, not noise
            </h2>
            <p className="body-text mb-8">
              AI-IDEI is for people who want practical advantage in copywriting and marketing.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { icon: PenTool, text: "creators who want to publish faster and better" },
                { icon: Zap, text: "freelancers who want stronger messaging and more speed" },
                { icon: Target, text: "consultants who need clearer offers and sharper communication" },
                { icon: TrendingUp, text: "marketers who want better systems and better output" },
                { icon: Rocket, text: "founders who want to turn ideas into assets and campaigns" },
                { icon: Sparkles, text: "operators who want practical AI, not vague hype" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60 italic border-t border-border pt-6">
              This is not for people who want theory without execution, tools without application, or endless prompting without results.
            </p>
          </motion.div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 8 — WHY IT IS DIFFERENT ═══ */}
      <SectionShell alt>
        <div className="text-flow px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
            <h2 className="heading-2 mb-8">
              Not another prompt pack. Not another content library.
            </h2>
            <div className="body-text space-y-5">
              <p>Most AI resources give you fragments.</p>
              <div className="pl-5 border-l-2 border-primary/15 space-y-1.5 text-sm text-muted-foreground/70">
                <p>A few prompts.</p>
                <p>A few ideas.</p>
                <p>A few templates.</p>
                <p>A little inspiration.</p>
              </div>
              <p>Then you are back in the same place: still thinking, still guessing, still rebuilding from scratch.</p>
              <p className="text-foreground font-bold text-base sm:text-lg leading-snug">AI-IDEI is different because it is built around one goal: help you turn thought into execution.</p>
              <div className="space-y-3 pt-2">
                {["clearer direction", "better structure", "faster production", "stronger commercial communication", "more usable output from less mental friction"].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-foreground text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <p className="pt-4 text-foreground font-semibold italic text-base">It is not built to look smart. It is built to help you produce.</p>
            </div>
          </motion.div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 9 — BENEFITS ═══ */}
      <SectionShell>
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-14">
            <h2 className="heading-2">What changes when you use AI-IDEI</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={i} variants={fadeUp} className="p-6 sm:p-7 rounded-2xl border border-border bg-card border-l-4 border-l-primary/20 hover:border-l-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <b.icon className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="heading-4">{b.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 10 — SOCIAL PROOF ═══ */}
      <SectionShell alt>
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-12">
            <h2 className="heading-2">
              Built for people who want sharper thinking and stronger execution
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {[
              { quote: "AI-IDEI helped me turn scattered thoughts into clearer copy and a much stronger offer.", name: "Coming soon", role: "Early user" },
              { quote: "This feels less like a resource library and more like an execution system for marketing.", name: "Coming soon", role: "Early user" },
              { quote: "I used it to move faster, write better, and structure my ideas in a way that actually led to usable output.", name: "Coming soon", role: "Early user" },
            ].map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={i} variants={fadeUp} className="p-6 rounded-2xl border border-border bg-background relative">
                <div className="text-4xl font-serif text-primary/15 leading-none mb-3">"</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">{t.quote}</p>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 11 — INSIDE THE SYSTEM ═══ */}
      <SectionShell>
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-12">
            <h2 className="heading-2 mb-4">Inside AI-IDEI</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Explore a growing system of practical resources for copywriting, marketing, and business execution.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="flex flex-wrap justify-center gap-2.5">
            {CATEGORIES.map((cat, i) => (
              <motion.span key={cat} variants={fadeUp} custom={i} className="text-xs px-5 py-2.5 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground transition-all cursor-default capitalize font-medium">
                {cat}
              </motion.span>
            ))}
          </motion.div>

          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mt-10 text-sm text-muted-foreground">
            Everything is built to help you move from idea to action with less friction and stronger results.
          </motion.p>
        </div>
      </SectionShell>

      {/* ═══ SECTION 12 — PRICING ═══ */}
      <SectionShell id="pricing" alt>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-14 sm:mb-16">
            <h2 className="heading-2 mb-4">Choose the level that matches your ambition</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
              Start simple. Upgrade when you want more depth, speed, and leverage.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={i} variants={fadeUp} className={cn(
                "relative p-6 sm:p-7 rounded-2xl border bg-background flex flex-col",
                plan.featured ? "border-primary/40 ring-1 ring-primary/15 shadow-xl shadow-primary/8" : "border-border"
              )}>
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 eyebrow bg-primary text-primary-foreground px-3 py-1 rounded-full whitespace-nowrap">Popular</span>
                )}
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <plan.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-primary font-semibold mt-1 mb-4">{plan.promise}</p>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{plan.text}</p>
                <Button
                  onClick={ctaAction}
                  variant={plan.featured ? "default" : "outline"}
                  className={cn("w-full mt-6 gap-2 text-xs", plan.featured && "shadow-lg shadow-primary/15")}
                  size="sm"
                >
                  {plan.cta}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 13 — FAQ ═══ */}
      <SectionShell>
        <div className="text-flow px-5 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp} className="text-center mb-12">
            <h2 className="heading-2">Frequently Asked Questions</h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} custom={1} variants={fadeUp}>
            <Accordion type="single" collapsible className="space-y-2.5">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 sm:px-6 data-[state=open]:border-primary/20 data-[state=open]:bg-card/50 transition-all">
                  <AccordionTrigger className="text-sm font-medium py-5 hover:no-underline text-foreground text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </SectionShell>

      {/* ═══ SECTION 14 — FINAL CTA ═══ */}
      <section className="relative overflow-hidden py-20 sm:py-28 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.06] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/[0.07] rounded-full blur-[180px]" />

        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} custom={0} variants={fadeUp}>
            <h2 className="heading-2 mb-5 sm:mb-6">
              Stop collecting ideas.
              <br />
              <span className="text-primary">Start turning them into assets.</span>
            </h2>
            <p className="text-muted-foreground mb-10 sm:mb-12 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
              Use AI-IDEI to write faster, market better, and turn rough thinking into persuasive output.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
              <Button size="lg" onClick={ctaAction} className="btn-glow gap-2 px-10 h-12 sm:h-13 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.querySelector("#what-you-get")?.scrollIntoView({ behavior: "smooth" })} className="gap-2 h-12 sm:h-13 w-full sm:w-auto">
                <Eye className="h-4 w-4" />
                See What's Inside
              </Button>
            </div>
            <p className="text-xs font-semibold text-muted-foreground/50 tracking-wide">
              Less friction · Better copy · Stronger execution
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <Suspense fallback={null}><Footer /></Suspense>

      {/* Structured Data */}
      <OrganizationJsonLd />
      <WebApplicationJsonLd />
      <FAQJsonLd items={FAQS.map(f => ({ question: f.q, answer: f.a }))} />
    </div>
    </PageTransition>
  );
}
